import os
import re
import json
import sqlite3
import pymupdf
import glob
from typing import List, Dict, Any

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_DIR = os.path.join(BASE_DIR, 'data')
RAW_DIR = os.path.join(DATA_DIR, 'raw')
PROCESSED_DIR = os.path.join(DATA_DIR, 'processed')
CHUNKS_DIR = os.path.join(PROCESSED_DIR, 'chunks')
PACKS_DIR = os.path.join(PROCESSED_DIR, 'packs')
MANIFEST_PATH = os.path.join(RAW_DIR, 'manifest.json')

os.makedirs(CHUNKS_DIR, exist_ok=True)
os.makedirs(PACKS_DIR, exist_ok=True)

def sanitize_math_latex(text: str) -> str:
    """Standardizes mathematical notation and wraps clean formulas in KaTeX."""
    # Convert standard chemical reaction arrows
    text = text.replace('→', ' $\\rightarrow$ ')
    text = text.replace('⇌', ' $\\rightleftharpoons$ ')
    
    # Clean up multi-space
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Convert obvious equations like V = I * R or V = IR into KaTeX
    # (Leaving prose untouched while ensuring math has clean KaTeX formatting)
    text = re.sub(r'\b([A-Za-z])\s*=\s*([A-Za-z0-9]+)\s*\*\s*([A-Za-z0-9]+)\b', r'$\1 = \2 \\cdot \3$', text)
    text = re.sub(r'\b([A-Za-z])\s*=\s*([A-Za-z0-9]+)\s*/\s*([A-Za-z0-9]+)\b', r'$\\frac{\1}{\2}$', text)
    
    return text

def extract_pdf_pages(pdf_path: str) -> List[Dict[str, Any]]:
    """Extracts text and page numbers from a PDF file using PyMuPDF."""
    pages = []
    try:
        doc = pymupdf.open(pdf_path)
        for page_idx, page in enumerate(doc):
            text = page.get_text()
            if text and len(text.strip()) > 30:
                pages.append({
                    'page_num': page_idx + 1,
                    'text': text.strip()
                })
        doc.close()
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    return pages

def chunk_textbook(pages: List[Dict[str, Any]], meta: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Chunks textbook pages logically by topic headings or natural page windows."""
    chunks = []
    current_chunk = []
    current_len = 0
    start_page = 1
    
    # Detect chapter title from first page
    chapter_name = meta.get('title', 'Chapter')
    if pages:
        first_lines = pages[0]['text'].split('\n')[:5]
        for line in first_lines:
            line_clean = line.strip()
            if len(line_clean) > 4 and not line_clean.isdigit():
                chapter_name = line_clean
                break

    for p in pages:
        p_num = p['page_num']
        text = p['text']
        
        # Clean header/footer artifacts
        cleaned_lines = []
        for line in text.split('\n'):
            line_str = line.strip()
            # Skip pure page numbers or reprint strings
            if re.match(r'^(page\s*\d+|\d+|reprint\s*\d{4}-\d{2})$', line_str, re.IGNORECASE):
                continue
            cleaned_lines.append(line_str)
        
        page_clean_text = '\n'.join(cleaned_lines)
        if not current_chunk:
            start_page = p_num

        current_chunk.append(page_clean_text)
        current_len += len(page_clean_text.split())

        # Target chunks between 350 - 650 words
        if current_len >= 400:
            combined_text = '\n\n'.join(current_chunk)
            chunk_id = f"{meta['id']}-p{start_page}-{p_num}"
            
            # Extract topic/subtopic if available from heading
            first_sentence = combined_text.split('.')[0] if '.' in combined_text else combined_text[:60]
            topic = first_sentence.replace('\n', ' ').strip()
            if len(topic) > 60:
                topic = topic[:60] + '...'

            chunks.append({
                'id': chunk_id,
                'board': meta.get('board', 'CBSE'),
                'grade': meta.get('grade', 'Grade 10'),
                'subject': meta.get('subject', 'General Science'),
                'chapter': chapter_name,
                'topic': topic,
                'subtopic': f"Pages {start_page}-{p_num}",
                'docType': 'textbook',
                'source': f"{meta.get('board', 'CBSE')} {meta.get('grade', 'Grade 10')} {meta.get('subject', '')}, {chapter_name}, Pages {start_page}-{p_num}",
                'content': sanitize_math_latex(combined_text)
            })
            current_chunk = []
            current_len = 0

    if current_chunk:
        combined_text = '\n\n'.join(current_chunk)
        chunk_id = f"{meta['id']}-p{start_page}-{pages[-1]['page_num']}"
        chunks.append({
            'id': chunk_id,
            'board': meta.get('board', 'CBSE'),
            'grade': meta.get('grade', 'Grade 10'),
            'subject': meta.get('subject', 'General Science'),
            'chapter': chapter_name,
            'topic': chapter_name,
            'subtopic': f"Pages {start_page}-{pages[-1]['page_num']}",
            'docType': 'textbook',
            'source': f"{meta.get('board', 'CBSE')} {meta.get('grade', 'Grade 10')} {meta.get('subject', '')}, {chapter_name}, Pages {start_page}-{pages[-1]['page_num']}",
            'content': sanitize_math_latex(combined_text)
        })

    return chunks

def chunk_exam_paper(pages: List[Dict[str, Any]], meta: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Chunks sample question papers and marking schemes into structured question/answer chunks."""
    chunks = []
    full_text = '\n\n'.join([f"--- Page {p['page_num']} ---\n" + p['text'] for p in pages])
    
    # Split by Question numbers (Q. 1, Q1, Question 1, 1., etc.)
    q_blocks = re.split(r'\n(?=(?:Q(?:uestion)?\.?\s*\d+|\b\d{1,2}\.|\bSection\s+[A-E]\b))', full_text)
    
    doc_type = meta.get('docType', 'sample_paper')
    board = meta.get('board', 'CBSE')
    grade = meta.get('grade', 'Grade 12')
    subject = meta.get('subject', 'Physics')
    year = meta.get('year', '2024-25')

    current_section = "General"
    for idx, block in enumerate(q_blocks):
        block_clean = block.strip()
        if len(block_clean) < 40:
            continue
            
        if block_clean.startswith('Section') or 'SECTION' in block_clean[:20]:
            current_section = block_clean.split('\n')[0][:30]

        # First line as title
        first_line = block_clean.split('\n')[0].strip()
        title = f"{first_line} ({doc_type.replace('_', ' ').title()})"
        if len(title) > 60:
            title = title[:60] + '...'

        chunk_id = f"{meta['id']}-q{idx+1}"
        chunks.append({
            'id': chunk_id,
            'board': board,
            'grade': grade,
            'subject': subject,
            'chapter': f"Official Exam Material ({year})",
            'topic': f"{current_section} - {title}",
            'subtopic': f"{doc_type.replace('_', ' ').title()} - {year}",
            'docType': doc_type,
            'source': f"{board} {grade} {subject} {doc_type.replace('_', ' ').title()} ({year}), {first_line[:40]}",
            'content': sanitize_math_latex(block_clean)
        })

    return chunks

def process_all_curriculum():
    """Processes all downloaded materials registered in manifest.json."""
    if not os.path.exists(MANIFEST_PATH):
        print("Manifest not found. Run scrape_curriculum.py first.")
        return

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    print(f"\n====================================================")
    print(f"   USHER CURRICULUM INGESTION & PACKING PIPELINE    ")
    print(f"   Total registered items in manifest: {len(manifest)}")
    print(f"====================================================\n")

    all_chunks_by_board = {}
    processed_count = 0

    for item in manifest:
        rel_path = item.get('localPath')
        if not rel_path:
            continue
        full_path = os.path.join(BASE_DIR, rel_path)
        if not os.path.exists(full_path) or os.path.getsize(full_path) < 1000:
            continue

        doc_type = item.get('docType', 'textbook')
        board = item.get('board', 'CBSE')
        pages = extract_pdf_pages(full_path)
        if not pages:
            continue

        if doc_type == 'textbook':
            chunks = chunk_textbook(pages, item)
        else:
            chunks = chunk_exam_paper(pages, item)

        if not chunks:
            continue

        processed_count += 1
        if board not in all_chunks_by_board:
            all_chunks_by_board[board] = []
        all_chunks_by_board[board].extend(chunks)

        if processed_count % 10 == 0:
            print(f"  Processed {processed_count} documents... ({sum(len(c) for c in all_chunks_by_board.values())} chunks generated)", flush=True)

    # Save chunks partitioned by board
    print("\n--- Saving Processed Chunks ---", flush=True)
    for board, chunks in all_chunks_by_board.items():
        chunk_file = os.path.join(CHUNKS_DIR, f"{board.lower().replace(' ', '_')}_chunks.json")
        with open(chunk_file, 'w', encoding='utf-8') as f:
            json.dump(chunks, f, indent=2)
        print(f"  Saved {len(chunks)} chunks for {board} -> {chunk_file}", flush=True)

    print(f"\n====================================================")
    print(f"INGESTION COMPLETE! Processed {processed_count} documents.")
    print(f"Total structured chunks generated: {sum(len(c) for c in all_chunks_by_board.values())}")
    print(f"====================================================")

if __name__ == '__main__':
    process_all_curriculum()
