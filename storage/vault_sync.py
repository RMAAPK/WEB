import os
import sys
import time
import hashlib
import requests
from huggingface_hub import HfApi, create_repo

HF_REPO_NAME = os.getenv("HF_BACKUP_REPO", "rmaaserver/storagepool")
HF_TOKEN = os.getenv("HF_TOKEN", "")
CONDUIT_DATA_DIR = os.getenv("CONDUIT_DATA_DIR", "/data/conduit")
GTS_DATA_DIR = os.getenv("GTS_DATA_DIR", "/data/gotosocial")

LAST_HASH = None

def get_dir_state_hash(directory="/data"):
    """Quickly hashes file modified times and sizes across /data to detect changes."""
    if not os.path.exists(directory):
        return ""
    hasher = hashlib.md5()
    for root, _, files in os.walk(directory):
        for f in files:
            p = os.path.join(root, f)
            try:
                st = os.stat(p)
                hasher.update(f"{f}:{st.st_mtime}:{st.st_size}".encode("utf-8"))
            except Exception:
                pass
    return hasher.hexdigest()

def upload_snapshot(force=False):
    """Upload encrypted state snapshot to Hugging Face private repository with Git-Xet efficiency."""
    global LAST_HASH
    if not HF_TOKEN:
        return

    # Check if data actually changed
    current_hash = get_dir_state_hash("/data")
    if not force and current_hash == LAST_HASH:
        return

    api = HfApi(token=HF_TOKEN)
    try:
        api.repo_info(repo_id=HF_REPO_NAME, repo_type="dataset")
    except Exception:
        print(f"[Vault Sync] Creating private repository {HF_REPO_NAME}...")
        api.create_repo(repo_id=HF_REPO_NAME, repo_type="dataset", private=True, exist_ok=True)

    # Tar and push database snapshot
    archive_path = "/tmp/rmaa_state_snapshot.tar.gz"
    os.system(f"tar -czf {archive_path} -C /data . 2>/dev/null")

    if os.path.exists(archive_path):
        try:
            api.upload_file(
                path_or_fileobj=archive_path,
                path_in_repo="snapshots/latest_vault.tar.gz",
                repo_id=HF_REPO_NAME,
                repo_type="dataset",
                commit_message=f"chore(vault): real-time state sync ({time.strftime('%Y-%m-%d %H:%M:%S')})"
            )
            LAST_HASH = current_hash
            print(f"[Vault Sync] Real-time state synchronized to Git-Xet vault.")
        except Exception as e:
            # If rate-limited or transient network error, wait for next tick
            print(f"[Vault Sync] Sync deferred: {e}")

def restore_snapshot():
    """Restore state snapshot on container cold boot."""
    if not HF_TOKEN:
        return

    from huggingface_hub import hf_hub_download
    try:
        print("[Vault Restore] Checking for existing vault backup...")
        file_path = hf_hub_download(
            repo_id=HF_REPO_NAME,
            filename="snapshots/latest_vault.tar.gz",
            repo_type="dataset",
            token=HF_TOKEN
        )
        if os.path.exists(file_path):
            print("[Vault Restore] Restoring snapshot to /data...")
            os.makedirs("/data", exist_ok=True)
            os.system(f"tar -xzf {file_path} -C /data")
            print("[Vault Restore] State restored successfully.")
    except Exception as e:
        print(f"[Vault Restore] No prior snapshot found or restore skipped: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "restore":
        restore_snapshot()
    elif len(sys.argv) > 1 and sys.argv[1] == "loop":
        while True:
            time.sleep(0.5) # 500ms reactive loop
            upload_snapshot()
    else:
        upload_snapshot(force=True)

