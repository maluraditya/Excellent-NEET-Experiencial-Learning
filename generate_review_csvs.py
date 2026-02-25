import re
import csv
import os

# Paths
ROOT_DIR = "/Users/aditya_malur/Main Docs/Plutoo/Vibe Coding/Excellent-Academy-Digital-textbook-2026"
ELEV_INDEX = os.path.join(ROOT_DIR, "data/grades/11th/index.ts")
TWELV_INDEX = os.path.join(ROOT_DIR, "data/grades/12th/index.ts")
TEXTBOOK_CONTENT = os.path.join(ROOT_DIR, "components/TextbookContent.tsx")
OUT_DIR = os.path.join(ROOT_DIR, "review_sheets")

def get_topics_from_index(filepath):
    topics = []
    with open(filepath, 'r') as f:
        content = f.read()

    # Simple regex to find objects in TOPICS array
    # Looking for id, title, subject, youtubeVideoIds
    import ast
    # The files contain an array of objects. We can try a more robust regex.
    # Because JS objects can be multiline, we find anything between { and } that has an id: 
    blocks = re.split(r'\{\s*id:', content)[1:]
    for block in blocks:
        block = '{ id:' + block # restore start
        
        id_match = re.search(r"id:\s*['\"]([^'\"]+)['\"]", block)
        title_match = re.search(r"title:\s*['\"]([^'\"]+)['\"]", block)
        subject_match = re.search(r"subject:\s*['\"]([^'\"]+)['\"]", block)
        videos_match = re.search(r"youtubeVideoIds:\s*\[(.*?)\]", block.replace('\n', ''))
        
        if id_match and title_match and subject_match:
            videos = []
            if videos_match:
                v_str = videos_match.group(1)
                videos = [v.strip().strip("'\"") for v in v_str.split(',') if v.strip().strip("'\"")]
            
            topics.append({
                'id': id_match.group(1),
                'title': title_match.group(1),
                'subject': subject_match.group(1),
                'videos': videos
            })
    return topics

def get_content_map():
    with open(TEXTBOOK_CONTENT, 'r') as f:
        content = f.read()
    
    # Split by topic?.id ===
    blocks = content.split("topic?.id === '")
    content_map = {}
    for block in blocks[1:]:
        topic_id = block.split("'")[0]
        # find the return block
        return_match = re.search(r'return\s*\((.*?)\);', block, re.DOTALL)
        if return_match:
            jsx_content = return_match.group(1)
            # Remove VideoSection
            jsx_content = re.sub(r'<VideoSection\s*/>', '', jsx_content)
            # Extract list items with bullets before stripping tags
            jsx_content = re.sub(r'<li>(.*?)</li>', r'• \1\n', jsx_content, flags=re.IGNORECASE|re.DOTALL)
            # Remove other tags
            text_content = re.sub(r'<[^>]+>', ' ', jsx_content)
            # Clean up whitespace
            text_content = re.sub(r'[ \t]+', ' ', text_content).strip()
            # Replace multiple newlines with a single newline, wait no, let's keep some formatting
            text_content = re.sub(r'\n\s*\n', '\n', text_content)
            content_map[topic_id] = text_content
    return content_map

def generate_csvs():
    topics_11 = get_topics_from_index(ELEV_INDEX)
    topics_12 = get_topics_from_index(TWELV_INDEX)
    
    content_map = get_content_map()
    
    headers = [
        "Topic",
        "Overall Topic Rating out of 10",
        "Simulation Rating (out of 10)",
        "How can we make simulation 10/10",
        "Existing Content",
        "Changes for Content",
        "Existing Video Resources",
        "Video Resource Updates Needed"
    ]
    
    subjects = ["Physics", "Chemistry", "Biology"]
    
    for subject in subjects:
        out_path = os.path.join(OUT_DIR, f"{subject}_Review.csv")
        with open(out_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            writer.writerow(["11th Standard"])
            writer.writerow(headers)
            has_11 = False
            for t in topics_11:
                if t['subject'] == subject:
                    has_11 = True
                    content = content_map.get(t['id'], "(No detailed content found)")
                    vid_links = " | ".join([f"https://youtube.com/watch?v={v}" for v in t['videos'] if v and not v.startswith('video')])
                    writer.writerow([t['title'], "", "", "", content, "", vid_links, ""])
            if not has_11:
                writer.writerow(["(No topics available yet)", "", "", "", "", "", "", ""])
            
            writer.writerow([])
            writer.writerow(["12th Standard"])
            writer.writerow(headers)
            has_12 = False
            for t in topics_12:
                if t['subject'] == subject:
                    has_12 = True
                    content = content_map.get(t['id'], "(No detailed content found)")
                    vid_links = " | ".join([f"https://youtube.com/watch?v={v}" for v in t['videos'] if v and not v.startswith('video')])
                    writer.writerow([t['title'], "", "", "", content, "", vid_links, ""])
            if not has_12:
                writer.writerow(["(No topics available yet)", "", "", "", "", "", "", ""])

if __name__ == "__main__":
    generate_csvs()
    print("CSVs generated successfully.")
