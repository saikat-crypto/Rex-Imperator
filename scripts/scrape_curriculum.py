import os
import re
import ssl
import json
import time
import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter

class LegacySSLAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        ctx = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ctx.options |= 0x4
        kwargs['ssl_context'] = ctx
        return super().init_poolmanager(*args, **kwargs)

session = requests.Session()
session.mount('https://', LegacySSLAdapter())
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_DIR = os.path.join(BASE_DIR, 'data', 'raw')
MANIFEST_PATH = os.path.join(DATA_DIR, 'manifest.json')

manifest = []
if os.path.exists(MANIFEST_PATH):
    try:
        with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
    except Exception:
        manifest = []

manifest_urls = {item['sourceUrl']: item for item in manifest}

def download_file(url, target_path, meta):
    if os.path.exists(target_path) and os.path.getsize(target_path) > 1000:
        meta['localPath'] = os.path.relpath(target_path, BASE_DIR).replace('\\', '/')
        meta['fileSize'] = os.path.getsize(target_path)
        manifest_urls[url] = meta
        return True

    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    try:
        r = session.get(url, headers=headers, stream=True, timeout=30)
        if r.status_code == 200:
            with open(target_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=65536):
                    if chunk:
                        f.write(chunk)
            meta['localPath'] = os.path.relpath(target_path, BASE_DIR).replace('\\', '/')
            meta['fileSize'] = os.path.getsize(target_path)
            manifest_urls[url] = meta
            print(f"  [DOWNLOADED] {meta['title']} ({meta['fileSize'] // 1024} KB)", flush=True)
            return True
        else:
            print(f"  [ERROR {r.status_code}] {url}", flush=True)
            return False
    except Exception as e:
        print(f"  [FAILED] {url} -> {e}", flush=True)
        return False

def save_manifest():
    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(list(manifest_urls.values()), f, indent=2)

# ==========================================
# 1. CBSE SYLLABUSES & SQP / MARKING SCHEMES
# ==========================================
def scrape_cbse_curriculum():
    print("\n--- Scraping CBSE Curriculum 2024-25 ---", flush=True)
    cbse_base = "https://cbseacademic.nic.in/"
    r = session.get(f"{cbse_base}curriculum_2025.html", headers=headers, timeout=15)
    if r.status_code != 200:
        print("Failed to fetch CBSE curriculum index page", flush=True)
        return

    soup = BeautifulSoup(r.text, 'html.parser')
    subject_map = {
        'physics': ('Physics', 'Grade 11-12'),
        'chemistry': ('Chemistry', 'Grade 11-12'),
        'biology': ('Biology', 'Grade 11-12'),
        'maths_srsec': ('Mathematics', 'Grade 11-12'),
        'english_core': ('English Core', 'Grade 11-12'),
        'science_sec': ('Science', 'Grade 9-10'),
        'maths_sec': ('Mathematics', 'Grade 9-10'),
        'english_ll': ('English Language & Literature', 'Grade 9-10'),
    }

    for a in soup.find_all('a', href=True):
        href = a['href']
        if not href.endswith('.pdf'):
            continue
        full_url = href if href.startswith('http') else cbse_base + href
        hl = href.lower()
        for key, (subj, grade) in subject_map.items():
            if key in hl:
                fname = os.path.basename(href)
                target = os.path.join(DATA_DIR, 'cbse', 'syllabuses', fname)
                meta = {
                    'id': f"cbse-syl-2025-{key}",
                    'board': 'CBSE',
                    'grade': grade,
                    'subject': subj,
                    'docType': 'syllabus',
                    'year': '2024-25',
                    'title': f"CBSE {grade} {subj} Syllabus 2024-25",
                    'sourceUrl': full_url
                }
                download_file(full_url, target, meta)
    save_manifest()

def scrape_cbse_sqp_ms():
    print("\n--- Scraping CBSE Sample Papers & Marking Schemes ---", flush=True)
    cbse_base = "https://cbseacademic.nic.in/"
    years = [
        ('2024-25', 'SQP_CLASSXII_2024-25.html', 'SQP_CLASSX_2024-25.html'),
        ('2023-24', 'SQP_CLASSXII_2023-24.html', 'SQP_CLASSX_2023-24.html'),
        ('2022-23', 'SQP_CLASSXII_2022-23.html', 'SQP_CLASSX_2022-23.html'),
    ]

    for year, xii_page, x_page in years:
        for page, grade, default_subjects in [
            (xii_page, 'Grade 12', ['physics', 'chemistry', 'mathematics', 'biology', 'english core']),
            (x_page, 'Grade 10', ['science', 'mathematics', 'english - language', 'english language'])
        ]:
            url = f"{cbse_base}{page}"
            try:
                r = session.get(url, headers=headers, timeout=15)
                if r.status_code != 200:
                    continue
                soup = BeautifulSoup(r.text, 'html.parser')
                for tr in soup.find_all('tr'):
                    tds = [td.text.strip().replace('\n', ' ') for td in tr.find_all(['td', 'th'])]
                    if len(tds) < 3 or len(tds[0]) > 60:
                        continue
                    subj_name = tds[0]
                    subj_lower = subj_name.lower()
                    if not any(target in subj_lower for target in default_subjects):
                        continue

                    clean_subj = re.sub(r'[^a-zA-Z0-9]', '_', subj_name).strip('_')
                    for a in tr.find_all('a', href=True):
                        h = a['href']
                        t = a.text.strip().upper()
                        full_url = h if h.startswith('http') else cbse_base + h
                        doc_type = 'sample_paper' if 'SQP' in t or 'sqp' in h.lower() else 'marking_scheme'
                        folder = 'sample_papers' if doc_type == 'sample_paper' else 'marking_schemes'
                        fname = f"{year}_{grade.replace(' ', '')}_{clean_subj}_{doc_type}.pdf"
                        target = os.path.join(DATA_DIR, 'cbse', folder, fname)
                        meta = {
                            'id': f"cbse-{grade.lower().replace(' ', '')}-{clean_subj.lower()}-{year}-{doc_type}",
                            'board': 'CBSE',
                            'grade': grade,
                            'subject': subj_name,
                            'docType': doc_type,
                            'year': year,
                            'title': f"CBSE {grade} {subj_name} {doc_type.replace('_', ' ').title()} ({year})",
                            'sourceUrl': full_url
                        }
                        download_file(full_url, target, meta)
            except Exception as e:
                print(f"Error scraping {url}: {e}", flush=True)
    save_manifest()

# ==========================================
# 2. CBSE NCERT TEXTBOOKS (via Internet Archive)
# ==========================================
def scrape_ncert_textbooks():
    print("\n--- Scraping Official NCERT Textbooks ---", flush=True)
    books = [
        # Class 10
        ('ncert-jesc1', 'Grade 10', 'Science', 'Class 10 Science'),
        ('ncert-jeff1', 'Grade 10', 'English', 'First Flight'),
        # Class 11
        ('ncert-keph1', 'Grade 11', 'Physics', 'Physics Part 1'),
        ('ncert-keph2', 'Grade 11', 'Physics', 'Physics Part 2'),
        ('ncert-kech1', 'Grade 11', 'Chemistry', 'Chemistry Part 1'),
        ('ncert-kech2', 'Grade 11', 'Chemistry', 'Chemistry Part 2'),
        ('ncert-kebo1', 'Grade 11', 'Biology', 'Biology'),
        ('ncert-kemh1', 'Grade 11', 'Mathematics', 'Mathematics'),
        ('ncert-kesp1', 'Grade 11', 'English', 'Snapshots'),
        # Class 12
        ('ncert-leph1', 'Grade 12', 'Physics', 'Physics Part 1'),
        ('ncert-leph2', 'Grade 12', 'Physics', 'Physics Part 2'),
        ('ncert-lech1', 'Grade 12', 'Chemistry', 'Chemistry Part 1'),
        ('ncert-lech2', 'Grade 12', 'Chemistry', 'Chemistry Part 2'),
        ('ncert-lebo1', 'Grade 12', 'Biology', 'Biology'),
        ('ncert-lemh1', 'Grade 12', 'Mathematics', 'Mathematics Part 1'),
        ('ncert-lemh2', 'Grade 12', 'Mathematics', 'Mathematics Part 2'),
        ('ncert-lefl1', 'Grade 12', 'English', 'Flamingo'),
        # Class 9
        ('ncert-iesc1', 'Grade 9', 'Science', 'Class 9 Science'),
        ('ncert-iemh1', 'Grade 9', 'Mathematics', 'Class 9 Mathematics'),
        ('ncert-iebe1', 'Grade 9', 'English', 'Beehive'),
        ('ncert-iemo1', 'Grade 9', 'English', 'Moments'),
    ]

    for item_id, grade, subject, book_title in books:
        meta_url = f"https://archive.org/metadata/{item_id}"
        try:
            r = session.get(meta_url, timeout=15)
            if r.status_code != 200:
                continue
            data = r.json()
            files = data.get('files', [])
            chapter_files = [f['name'] for f in files if f['name'].endswith('.pdf') and not f['name'].endswith('_text.pdf')]
            print(f"Downloading {book_title} ({grade}) - {len(chapter_files)} chapters...", flush=True)

            subfolder = f"{grade.replace(' ', '')}_{subject}"
            for ch_file in chapter_files:
                file_url = f"https://archive.org/download/{item_id}/{ch_file}"
                target = os.path.join(DATA_DIR, 'cbse', 'textbooks', subfolder, ch_file)
                meta = {
                    'id': f"cbse-tb-{item_id}-{ch_file.replace('.pdf', '')}",
                    'board': 'CBSE',
                    'grade': grade,
                    'subject': subject,
                    'docType': 'textbook',
                    'year': 'NCERT Current',
                    'title': f"NCERT {grade} {subject} ({book_title}) - {ch_file}",
                    'sourceUrl': file_url
                }
                download_file(file_url, target, meta)
            save_manifest()
        except Exception as e:
            print(f"Error fetching metadata for {item_id}: {e}", flush=True)

# ==========================================
# 3. CISCE (ICSE / ISC)
# ==========================================
def scrape_cisce():
    print("\n--- Scraping CISCE (ICSE & ISC) Materials ---", flush=True)
    cisce_items = [
        # ICSE Syllabuses 2025
        ('https://cisce.org/wp-content/uploads/2025/03/1.-ICSE-English_25.pdf', 'Grade 10', 'English', 'syllabus', '2025', 'ICSE Class 10 English Syllabus 2025'),
        ('https://cisce.org/wp-content/uploads/2025/03/12.-ICSE-Mathematics_25.pdf', 'Grade 10', 'Mathematics', 'syllabus', '2025', 'ICSE Class 10 Mathematics Syllabus 2025'),
        ('https://cisce.org/wp-content/uploads/2025/03/13.-ICSE-Physics_25.pdf', 'Grade 10', 'Physics', 'syllabus', '2025', 'ICSE Class 10 Physics Syllabus 2025'),
        ('https://cisce.org/wp-content/uploads/2025/03/14.-ICSE-Chemistry_25.pdf', 'Grade 10', 'Chemistry', 'syllabus', '2025', 'ICSE Class 10 Chemistry Syllabus 2025'),
        ('https://cisce.org/wp-content/uploads/2025/03/15.-ICSE-Biology_25.pdf', 'Grade 10', 'Biology', 'syllabus', '2025', 'ICSE Class 10 Biology Syllabus 2025'),

        # ISC Syllabuses 2025
        ('https://cisce.org/wp-content/uploads/2025/04/2.-ISC-English-XI-XII_2025.pdf', 'Grade 12', 'English', 'syllabus', '2025', 'ISC Class 11-12 English Syllabus 2025'),
        ('https://cisce.org/wp-content/uploads/2025/04/23.-ISC-Mathematics-XI-Revised_2025.pdf', 'Grade 12', 'Mathematics', 'syllabus', '2025', 'ISC Class 11-12 Mathematics Syllabus 2025'),
        ('https://cisce.org/wp-content/uploads/2025/04/25.-ISC-Physics-XI-Revised_2025.pdf', 'Grade 12', 'Physics', 'syllabus', '2025', 'ISC Class 11-12 Physics Syllabus 2025'),
        ('https://cisce.org/wp-content/uploads/2025/04/27.-ISC-Chemistry-XI-Revised_2025.pdf', 'Grade 12', 'Chemistry', 'syllabus', '2025', 'ISC Class 11-12 Chemistry Syllabus 2025'),
        ('https://cisce.org/wp-content/uploads/2025/04/29.-ISC-Biology-XI-Revised_2025.pdf', 'Grade 12', 'Biology', 'syllabus', '2025', 'ISC Class 11-12 Biology Syllabus 2025'),

        # ICSE Specimen Papers & Marking Schemes 2025
        ('https://cisce.org/wp-content/uploads/2025/11/ICSE_2025_SPECIMEN_011_ENG1_QP_MS.pdf', 'Grade 10', 'English', 'specimen_paper', '2025', 'ICSE Class 10 English Paper 1 Specimen Paper & MS 2025'),
        ('https://cisce.org/wp-content/uploads/2025/11/ICSE_2025_SPECIMEN_012_ENG2_QP_MS_1.pdf', 'Grade 10', 'English', 'specimen_paper', '2025', 'ICSE Class 10 English Paper 2 Specimen Paper & MS 2025'),
        ('https://cisce.org/wp-content/uploads/2025/11/ICSE_2025_SPECIMEN_QP_MS_511_MAT_UPD.pdf', 'Grade 10', 'Mathematics', 'specimen_paper', '2025', 'ICSE Class 10 Mathematics Specimen Paper & MS 2025'),
        ('https://cisce.org/wp-content/uploads/2025/11/ICSE_2025_SPECIMEN_QP_MS_521_SCI1.pdf', 'Grade 10', 'Physics', 'specimen_paper', '2025', 'ICSE Class 10 Physics Specimen Paper & MS 2025'),
        ('https://cisce.org/wp-content/uploads/2025/11/ICSE_2025_SPECIMEN_QP_MS_522_SCI2.pdf', 'Grade 10', 'Chemistry', 'specimen_paper', '2025', 'ICSE Class 10 Chemistry Specimen Paper & MS 2025'),
        ('https://cisce.org/wp-content/uploads/2025/11/ICSE_2025_SPECIMEN_QP_MS_523_SCI3.pdf', 'Grade 10', 'Biology', 'specimen_paper', '2025', 'ICSE Class 10 Biology Specimen Paper & MS 2025'),

        # ISC Specimen Papers & Marking Schemes 2025
        ('https://cisce.org/wp-content/uploads/2025/04/ENGLISH-PAPER-1-LANGUAGE.pdf', 'Grade 12', 'English', 'specimen_paper', '2025', 'ISC Class 12 English Paper 1 Specimen Paper & MS 2025'),
        ('https://cisce.org/wp-content/uploads/2025/04/ENGLISH-PAPER-2-1.pdf', 'Grade 12', 'English', 'specimen_paper', '2025', 'ISC Class 12 English Paper 2 Specimen Paper & MS 2025'),
        ('https://cisce.org/wp-content/uploads/2025/04/860-MATHEMATICS-SQP-AK.pdf', 'Grade 12', 'Mathematics', 'specimen_paper', '2025', 'ISC Class 12 Mathematics Specimen Paper & MS 2025'),
        ('https://cisce.org/wp-content/uploads/2025/04/861-PHYSICS-SQP-AK.pdf', 'Grade 12', 'Physics', 'specimen_paper', '2025', 'ISC Class 12 Physics Specimen Paper & MS 2025'),
        ('https://cisce.org/wp-content/uploads/2025/04/862-CHEMISTRY-SQP-AK.pdf', 'Grade 12', 'Chemistry', 'specimen_paper', '2025', 'ISC Class 12 Chemistry Specimen Paper & MS 2025'),
        ('https://cisce.org/wp-content/uploads/2025/04/BIOLOGY-PAPER-1-2.pdf', 'Grade 12', 'Biology', 'specimen_paper', '2025', 'ISC Class 12 Biology Specimen Paper & MS 2025'),

        # ISC 2024
        ('https://cisce.org/wp-content/uploads/2025/04/861-PHYSICS-PAPER-1.pdf', 'Grade 12', 'Physics', 'specimen_paper', '2024', 'ISC Class 12 Physics Specimen Paper 2024'),
        ('https://cisce.org/wp-content/uploads/2025/04/862-CHEMISTRY-PAPER-1.pdf', 'Grade 12', 'Chemistry', 'specimen_paper', '2024', 'ISC Class 12 Chemistry Specimen Paper 2024'),
        ('https://cisce.org/wp-content/uploads/2025/04/860-MATHEMATICS.pdf', 'Grade 12', 'Mathematics', 'specimen_paper', '2024', 'ISC Class 12 Mathematics Specimen Paper 2024'),
        ('https://cisce.org/wp-content/uploads/2025/04/863-BIOLOGY-PAPER-1-1.pdf', 'Grade 12', 'Biology', 'specimen_paper', '2024', 'ISC Class 12 Biology Specimen Paper 2024'),
    ]

    for url, grade, subj, doc_type, year, title in cisce_items:
        folder = 'syllabuses' if doc_type == 'syllabus' else 'specimen_papers'
        fname = f"{year}_{grade.replace(' ', '')}_{subj}_{os.path.basename(url)}"
        target = os.path.join(DATA_DIR, 'icse', folder, fname)
        meta = {
            'id': f"icse-{grade.lower().replace(' ', '')}-{subj.lower()}-{year}-{os.path.basename(url).replace('.pdf', '')}",
            'board': 'ICSE' if grade == 'Grade 10' else 'ISC',
            'grade': grade,
            'subject': subj,
            'docType': doc_type,
            'year': year,
            'title': title,
            'sourceUrl': url
        }
        download_file(url, target, meta)
    save_manifest()

# ==========================================
# 4. WEST BENGAL BOARD (WBCHSE)
# ==========================================
def scrape_west_bengal():
    print("\n--- Scraping West Bengal Board (WBCHSE) Materials ---", flush=True)
    wb_items = [
        # WBCHSE Syllabuses
        ('https://wbchse.wb.gov.in/wp-content/uploads/2026/07/PHYS.pdf', 'Grade 11-12', 'Physics', 'syllabus', 'WBCHSE Class 11-12 Physics Syllabus'),
        ('https://wbchse.wb.gov.in/wp-content/uploads/2026/07/CHEM.pdf', 'Grade 11-12', 'Chemistry', 'syllabus', 'WBCHSE Class 11-12 Chemistry Syllabus'),
        ('https://wbchse.wb.gov.in/wp-content/uploads/2026/07/MATH.pdf', 'Grade 11-12', 'Mathematics', 'syllabus', 'WBCHSE Class 11-12 Mathematics Syllabus'),
        ('https://wbchse.wb.gov.in/wp-content/uploads/2026/07/BIOS.pdf', 'Grade 11-12', 'Biology', 'syllabus', 'WBCHSE Class 11-12 Biological Science Syllabus'),
        ('https://wbchse.wb.gov.in/wp-content/uploads/2026/07/ENGA.pdf', 'Grade 11-12', 'English A', 'syllabus', 'WBCHSE Class 11-12 English-A Syllabus'),
        ('https://wbchse.wb.gov.in/wp-content/uploads/2026/07/ENGB.pdf', 'Grade 11-12', 'English B', 'syllabus', 'WBCHSE Class 11-12 English-B Syllabus'),

        # WBCHSE Model Question Papers
        ('https://wbchse.wb.gov.in/wp-content/uploads/2026/01/Model-qus-paper-PHYSICS.pdf', 'Grade 12', 'Physics', 'model_paper', 'WBCHSE Class 12 Physics Model Question Paper'),
        ('https://wbchse.wb.gov.in/wp-content/uploads/2026/01/Model-qus-paper-CHEMISTRY.pdf', 'Grade 12', 'Chemistry', 'model_paper', 'WBCHSE Class 12 Chemistry Model Question Paper'),
        ('https://wbchse.wb.gov.in/wp-content/uploads/2026/01/Model-qus-paper-MATHEMATICS.pdf', 'Grade 12', 'Mathematics', 'model_paper', 'WBCHSE Class 12 Mathematics Model Question Paper'),
        ('https://wbchse.wb.gov.in/wp-content/uploads/2026/01/Model-qus-paper-BIOLOGICAL-SCIENCE.pdf', 'Grade 12', 'Biology', 'model_paper', 'WBCHSE Class 12 Biological Science Model Question Paper'),
        ('https://wbchse.wb.gov.in/wp-content/uploads/2026/01/ENGB.pdf', 'Grade 12', 'English B', 'model_paper', 'WBCHSE Class 12 English-B Model Question Paper'),
        ('https://wbchse.wb.gov.in/wp-content/uploads/2026/09/ENGA-SEM-III.pdf', 'Grade 12', 'English A', 'model_paper', 'WBCHSE Class 12 English-A Semester III Model Question Paper'),

        # Question Patterns
        ('https://wbchse.wb.gov.in/wp-content/uploads/2026/07/SEMESTER-3-QUESTION-PATTERNS-CLASS-XII.pdf', 'Grade 12', 'All Subjects', 'question_pattern', 'WBCHSE Class 12 Semester 3 Question Patterns'),
    ]

    for url, grade, subj, doc_type, title in wb_items:
        folder = 'syllabuses' if doc_type == 'syllabus' else ('model_papers' if doc_type == 'model_paper' else 'question_patterns')
        clean_subj = re.sub(r'[^a-zA-Z0-9]', '_', subj).strip('_')
        fname = f"{grade.replace(' ', '')}_{clean_subj}_{os.path.basename(url)}"
        target = os.path.join(DATA_DIR, 'west_bengal', folder, fname)
        meta = {
            'id': f"wb-{grade.lower().replace(' ', '')}-{clean_subj.lower()}-{doc_type}",
            'board': 'West Bengal Board (WBCHSE)',
            'grade': grade,
            'subject': subj,
            'docType': doc_type,
            'year': 'Current',
            'title': title,
            'sourceUrl': url
        }
        download_file(url, target, meta)
    save_manifest()

if __name__ == '__main__':
    print("====================================================")
    print("      USHER CURRICULUM SCRAPER & HARVESTER          ")
    print("====================================================")
    scrape_cbse_curriculum()
    scrape_cbse_sqp_ms()
    scrape_cisce()
    scrape_west_bengal()
    scrape_ncert_textbooks()
    print("\n====================================================")
    print(f"SCRAPING COMPLETE! Total items in manifest: {len(manifest_urls)}")
    print(f"Manifest saved to: {MANIFEST_PATH}")
    print("====================================================")
