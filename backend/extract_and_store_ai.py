#!/usr/bin/env python3
import sys, subprocess, re, time
import mysql.connector

# Chemin vers pdftotext (installer Poppler et mettre à jour ce chemin)
PDFTOTEXT = r"C:\poppler\bin\pdftotext.exe"

def run_pdftotext(path):
    res = subprocess.run([PDFTOTEXT, "-layout", path, "-"], capture_output=True, text=True)
    if res.returncode != 0:
        print(f"ERROR: pdftotext failed: {res.stderr.strip()}")
        sys.exit(1)
    return res.stdout

def parse_date(s):
    if not s:
        return None
    m = re.search(r"(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})", s)
    if m:
        d, mo, y = m.groups()
        return f"{y}-{mo}-{d}"
    return None

def parse_float(s):
    if not s:
        return None
    s = s.replace(" ", "").replace(",", ".").replace("€", "").strip()
    try:
        return float(s)
    except ValueError:
        m = re.search(r"(\d+\.\d+|\d+)", s)
        return float(m.group(1)) if m else None

def extract_first(patterns, text, flags=0):
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE | flags)
        if m:
            return m.group(1).strip()
    return None

def extract_dest(text):
    m = re.search(r"DESTINATAIRE\s*:\s*(.*?)(?:\n\s*\n|\Z)", text, re.IGNORECASE|re.DOTALL)
    if not m:
        return None
    lines = [l.strip() for l in m.group(1).splitlines() if l.strip()]
    return " | ".join(lines) if lines else None

# Vérification des arguments
if len(sys.argv) < 5:
    print("Usage: extract_and_store_ai.py <pdf> <projet> <expediteur> <type_id>")
    sys.exit(1)

pdf_path, projet, expediteur, type_id = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
text = run_pdftotext(pdf_path)

# --- Extraction ---
invoice_no = extract_first([
    r"FACTURE\s+PROFORMA\s*#\s*(\d+)",
    r"FACTURE\s*:\s*(\d+)"
], text) or "Proforma"

# date de facture
raw_df = extract_first([
    r"Date de facture.*?(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})"
], text)
date_fact = parse_date(raw_df)

# échéance : on tente plusieurs patterns puis fallback sur le 2ᵉ date trouvée
raw_due = extract_first([
    r"Échéance.*?(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})",
    r"Echeance.*?(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})"
], text, re.DOTALL)
if not raw_due:
    all_dates = re.findall(r"(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})", text)
    raw_due = all_dates[1] if len(all_dates) >= 2 else None
due_date = parse_date(raw_due)

# total TTC
raw_ttc = extract_first([
    r"Total\s*TTC\D*([\d\s,]+\.?\d*)",
    r"Net à payer\D*([\d\s,]+\.?\d*)"
], text, re.DOTALL)
total_ttc = parse_float(raw_ttc)

# destinataire
dest = extract_dest(text)

# --- Affichage avec délais ---
print("Processing invoice")
time.sleep(2)


# --- Insertion MySQL ---
db = mysql.connector.connect(
    host="localhost", user="root", password="root", database="symaflow_db"
)
cur = db.cursor()
sql = """
  INSERT INTO facture
    (expediteur, projet, type, date_facturation, echeance, total_ttc, destinataire)
  VALUES (%s, %s, %s, %s, %s, %s, %s)
"""
cur.execute(sql, (
    expediteur, projet, int(type_id),
    date_fact, due_date, total_ttc, dest
))
db.commit()
print(f"Success: Invoice {invoice_no} stored with ID {cur.lastrowid}")
cur.close()
db.close()