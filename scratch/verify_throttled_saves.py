import re
import os

def check_file_contains(filepath, patterns):
    print(f"Checking {filepath}...")
    if not os.path.exists(filepath):
        print(f"  [ERROR] File not found: {filepath}")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    all_found = True
    for pattern in patterns:
        if isinstance(pattern, tuple):
            pat, name = pattern
        else:
            pat = pattern
            name = pattern
            
        if re.search(pat, content):
            print(f"  [OK] Found: {name}")
        else:
            print(f"  [ERROR] Missing: {name}")
            all_found = False
            
    return all_found

def main():
    success = True
    
    success &= check_file_contains(
        'js/auth.js',
        [
            (r'let cloudSaveTimeoutId = null;', 'cloudSaveTimeoutId declaration'),
            (r'const CLOUD_SAVE_INTERVAL = 60000;', 'CLOUD_SAVE_INTERVAL constant'),
            (r'function saveAllToLocalStorage\(\)', 'saveAllToLocalStorage function definition'),
            (r'localStorage\.setItem\(\'fc_star_local_last_updated\', Date\.now\(\)\.toString\(\)\);', 'localLastUpdated update in saveAllToLocalStorage'),
            (r'saveAllToLocalStorage\(\);', 'saveAllToLocalStorage call in saveUserProgress'),
            (r'if \(timeSinceLastUpload >= CLOUD_SAVE_INTERVAL\)', 'Interval condition check'),
            (r'cloudSaveTimeoutId = setTimeout\(uploadProgress, delay\);', 'Deferred timeout scheduling'),
            (r'const localLastUpdated = parseInt\(localStorage\.getItem\(\'fc_star_local_last_updated\'\) \|\| \'0\'\) \|\| 0;', 'localLastUpdated read in syncUserDataOnLogin'),
            (r'if \(localLastUpdated > cloudLastUpdated\)', 'Conflict resolution timestamp check'),
            (r'refreshAllScreens\(\);', 'refreshAllScreens call'),
            (r'localStorage\.removeItem\(\'fc_star_local_last_updated\'\);', 'Clean timestamp on logout')
        ]
    )
    
    if success:
        print("\n[SUCCESS] Throttled save validation passed successfully!")
    else:
        print("\n[FAILURE] Validation failed.")

if __name__ == '__main__':
    main()
