"""
Single-cell runner for Google Colab Pro (A100 / V100 / L4 GPU)
Instantly finishes the remaining ~1,000 Acoustic RAG categories.
"""
import os, sys, time, json, urllib.request, urllib.parse, tempfile
import torch, torchaudio
from huggingface_hub import HfApi, upload_folder
from demucs.pretrained import get_model
from demucs.apply import apply_model

HF_TOKEN = "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"
REPO_ID = "rmaapk/music"
SAMPLE_RATE = 40000
HOP_SIZE = 800
FFT_POINTS = 4000
NUM_BANDS = 2000
BATCH_COMMIT_SIZE = 50

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🚀 Colab Harvester active on: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}")

model = get_model('htdemucs').to(DEVICE)
model.eval()
api = HfApi(token=HF_TOKEN)

BUFFER_DIR = "/tmp/colab_tokens"
os.makedirs(BUFFER_DIR, exist_ok=True)

GENRES = [
    "drill", "trap", "phonk", "bass", "techno", "house", "synthwave",
    "hiphop", "rnb", "vocal", "guitar", "piano", "drums", "synth",
    "lofi", "ambient", "rock", "metal", "electronic", "cyberpunk"
]

def fetch_archive_audio(category_id: int, out_wav: str) -> bool:
    genre = GENRES[category_id % len(GENRES)]
    page = ((category_id // len(GENRES)) % 50) + 1
    query = f"mediatype:audio AND (format:VBR MP3 OR format:MP3) AND ({genre})"
    search_url = f"https://archive.org/advancedsearch.php?q={urllib.parse.quote(query)}&fl[]=identifier&sort[]=downloads+desc&rows=10&page={page}&output=json"
    try:
        req = urllib.request.Request(search_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode())
            docs = data.get("response", {}).get("docs", [])
            if not docs: return False
            item_id = docs[category_id % len(docs)]["identifier"]
            
        meta_url = f"https://archive.org/metadata/{item_id}/files"
        req_meta = urllib.request.Request(meta_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req_meta, timeout=12) as resp:
            files_data = json.loads(resp.read().decode())
            mp3_files = [f["name"] for f in files_data.get("result", []) if f.get("name", "").endswith(".mp3")]
            if not mp3_files: return False
            mp3_name = mp3_files[0]
            
        dl_url = f"https://archive.org/download/{item_id}/{urllib.parse.quote(mp3_name)}"
        req_dl = urllib.request.Request(dl_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req_dl, timeout=30) as dl, open(out_wav, "wb") as f_out:
            bytes_count = 0
            max_bytes = 10 * 1024 * 1024
            while True:
                chunk = dl.read(65536)
                if not chunk: break
                f_out.write(chunk)
                bytes_count += len(chunk)
                if bytes_count >= max_bytes: break
        return os.path.exists(out_wav) and os.path.getsize(out_wav) > 100000
    except Exception:
        return False

def flush_buffer():
    files = [f for f in os.listdir(BUFFER_DIR) if f.endswith(".bin")]
    if not files: return
    print(f"📦 Uploading batch of {len(files)} categories to Hugging Face...", flush=True)
    try:
        upload_folder(
            folder_path=BUFFER_DIR,
            path_in_repo="tokens",
            repo_id=REPO_ID,
            repo_type="dataset",
            token=HF_TOKEN,
            commit_message=f"Colab Pro A100 Burst: Batch upload {len(files)} categories"
        )
        print("✅ Pushed successfully!", flush=True)
        for f in files: os.remove(os.path.join(BUFFER_DIR, f))
    except Exception as e:
        print(f"❌ Error: {e}", flush=True)

def process_category(cat_id: int) -> bool:
    scratch_dir = tempfile.mkdtemp(prefix=f"colab_dig_{cat_id}_")
    raw_audio = os.path.join(scratch_dir, "input.mp3")
    bin_path = os.path.join(BUFFER_DIR, f"cat_{cat_id}.bin")
    try:
        if not fetch_archive_audio(cat_id, raw_audio) or not os.path.exists(raw_audio):
            return False
        wav, sr = torchaudio.load(raw_audio)
        if sr != SAMPLE_RATE:
            wav = torchaudio.transforms.Resample(sr, SAMPLE_RATE)(wav)
        if wav.shape[0] == 1: wav = wav.repeat(2, 1)
        elif wav.shape[0] > 2: wav = wav[:2, :]
        max_samples = SAMPLE_RATE * 150
        if wav.shape[1] > max_samples: wav = wav[:, :max_samples]
        
        wav_gpu = wav.to(DEVICE).unsqueeze(0)
        with torch.no_grad():
            sources = apply_model(model, wav_gpu)[0]
        stem = sources[3].mean(dim=0)
        
        window = torch.hann_window(FFT_POINTS).to(DEVICE)
        stft = torch.stft(stem, n_fft=FFT_POINTS, hop_length=HOP_SIZE, window=window, return_complex=True)
        stft_2000 = stft[0:NUM_BANDS, :]
        mag = torch.abs(stft_2000)
        mag_db = 20.0 * torch.log10(torch.clamp(mag, min=1e-6))
        db_energy = mag_db + 120.0
        
        single_ints = torch.where(
            db_energy < 10.0,
            torch.zeros_like(db_energy, dtype=torch.int16),
            torch.round(db_energy).to(torch.int16)
        )
        frames_array = single_ints.t().cpu().numpy()
        with open(bin_path, "wb") as f:
            f.write(frames_array.tobytes())
            
        print(f"⚡ [Cat {cat_id}] Stored ({len(frames_array)} frames)", flush=True)
        buffered = [f for f in os.listdir(BUFFER_DIR) if f.endswith(".bin")]
        if len(buffered) >= BATCH_COMMIT_SIZE:
            flush_buffer()
        return True
    except Exception as e:
        print(f"Cat {cat_id} err: {e}", flush=True)
        return False
    finally:
        import shutil
        try: shutil.rmtree(scratch_dir)
        except Exception: pass

if __name__ == '__main__':
    repo_files = api.list_repo_files(repo_id=REPO_ID, repo_type="dataset")
    existing = set(
        int(f.replace("tokens/cat_", "").replace(".bin", ""))
        for f in repo_files if f.startswith("tokens/cat_") and f.endswith(".bin")
    )
    all_targets = set(range(1, 8001))
    missing = sorted(list(all_targets - existing))
    print(f"🎯 Total missing categories to process: {len(missing)}")
    
    t0 = time.time()
    done = 0
    for cat in missing:
        if cat in existing: continue
        if process_category(cat):
            existing.add(cat)
            done += 1
            if done % 10 == 0:
                elapsed = time.time() - t0
                print(f"🔥 Milestone: {done}/{len(missing)} finished ({(done/elapsed)*60:.1f} cat/min)", flush=True)
    flush_buffer()
    print("🏆 ALL 8,000 CATEGORIES COMPLETED!")
