import os
import re

search_terms = ['levelReward', '레벨', '보상', 'lee_dong_gyeong', '이동경']
workspace_dir = r"c:\Users\김재욱\OneDrive\바탕 화면\축구카드"

for root, dirs, files in os.walk(workspace_dir):
    if '.git' in root or 'node_modules' in root or '.system_generated' in root:
        continue
    for file in files:
        if file.endswith(('.js', '.html', '.css', '.txt', '.md')):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check search terms
                found = []
                for term in search_terms:
                    if term in content:
                        found.append(term)
                if found:
                    print(f"Found in {file_path}: {found}")
                    # Print matching lines
                    lines = content.splitlines()
                    for idx, line in enumerate(lines):
                        for term in search_terms:
                            if term in line:
                                print(f"  Line {idx+1}: {line.strip()[:100]}")
                                break
            except Exception as e:
                pass
