import json
import urllib.request
import urllib.parse
import time
import os
import sys

def translate_batch(texts, source='en', target='hi'):
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&q="
    results = []
    
    for text in texts:
        if not text:
            results.append("")
            continue
        req_url = url + urllib.parse.quote(text)
        req = urllib.request.Request(req_url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                translated = "".join([d[0] for d in data[0] if d[0]])
                results.append(translated)
        except Exception as e:
            print(f"Error translating {text}: {e}")
            results.append(text) # fallback
    return results

def main():
    json_path = sys.argv[1]
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # get unique states and names
    unique_states = list(set([item['state'] for item in data if 'state' in item and item['state']]))
    unique_names = list(set([item['name'] for item in data if 'name' in item and item['name']]))

    print(f"Translating {len(unique_states)} states...")
    state_translations = translate_batch(unique_states)
    state_map = dict(zip(unique_states, state_translations))

    print(f"Translating {len(unique_names)} names...")
    name_map = {}
    
    batch_size = 100
    for i in range(0, len(unique_names), batch_size):
        batch = unique_names[i:i+batch_size]
        print(f"Translating batch {i} to {i+len(batch)} of {len(unique_names)}")
        translated_batch = translate_batch(batch)
        for original, translated in zip(batch, translated_batch):
            name_map[original] = translated

    print("Updating JSON data...")
    for item in data:
        if 'state' in item:
            item['stateHi'] = state_map.get(item['state'], item['state'])
        if 'name' in item:
            item['nameHi'] = name_map.get(item['name'], item['name'])

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    print("Done!")

if __name__ == "__main__":
    main()
