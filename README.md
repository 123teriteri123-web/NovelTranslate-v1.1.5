# NovelTranslate

A simple web app to upload novels (EPUB, TXT), split them into chapters, and translate them automatically using OpenRouter models.

## ✨ Features
- Upload EPUB or TXT novels
- Automatic **chapter splitting** (supports `Chapter 1`, `Prologue`, `第1章`, etc.)
- Translate single chapters or **all chapters at once**
- Uses **OpenRouter API** (plug in your API key)
- Works locally or on Replit

---

## 🚀 Setup (Local)

1. Clone repo:
   ```bash
   git clone https://github.com/your-username/NovelTranslate.git
   cd NovelTranslate
   ```

2. Create virtual environment (optional, but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set environment variable for OpenRouter API key:
   ```bash
   export OPENROUTER_API_KEY=sk-or-xxxxxxxx
   ```

   On Windows (Powershell):
   ```powershell
   $env:OPENROUTER_API_KEY="sk-or-xxxxxxxx"
   ```

5. Run server:
   ```bash
   python app.py
   ```

6. Open browser at [http://localhost:5000](http://localhost:5000)

---

## 🌐 Running on Replit

1. Create a new Repl (Python).  
2. Upload project files (or unzip into Replit).  
3. In **Shell**, install requirements:
   ```bash
   pip install flask flask_sqlalchemy ebooklib requests
   ```
4. Add your `OPENROUTER_API_KEY` in **Secrets (lock icon)**.  
5. Add `.replit` file:
   ```toml
   run = "python app.py"
   ```
6. Click **Run** → app will open in a browser tab.

---

## 📦 Deployment (GitHub)

Push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/NovelTranslate.git
git push -u origin main
```

Now your repo is live!

---

## ⚖️ License

MIT License – free to use and modify.

---

## ⚠️ Note about this repository

To keep the repository size small, the following were excluded:
- `__pycache__`, `.pyc`, `.pyo`
- `uploads/` and `tmp/` (created automatically when you upload novels)
- Any `.db` / `.sqlite3` database files (a new database is created on first run)
- Local `venv/` environments
- Log files

This does **not affect functionality**. Everything will be regenerated automatically when you run the app.
