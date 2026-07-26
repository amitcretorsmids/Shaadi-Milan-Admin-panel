import json
import urllib.request
import urllib.parse
import sys

def translate_batch_fast(texts, source='en', target='hi'):
    if not texts: return []
    # Join texts with newlines. We use " \\n " so the translator keeps them separate
    combined_text = "\n".join(texts)
    
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t"
    data = urllib.parse.urlencode({'q': combined_text}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'User-Agent': 'Mozilla/5.0'})
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            translated_combined = "".join([d[0] for d in res_data[0] if d[0]])
            # Split by newline
            translated_list = [t.strip() for t in translated_combined.split('\n')]
            
            # If length mismatch, fallback to original (rare but possible if translator eats a newline)
            if len(translated_list) != len(texts):
                print(f"Mismatch in chunk! expected {len(texts)} got {len(translated_list)}")
                return texts
                
            return translated_list
    except Exception as e:
        print(f"Error in batch: {e}")
        return texts

def chunk_list(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

def main():
    json_path = sys.argv[1]
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    unique_states = list(set([item['state'] for item in data if 'state' in item and item['state']]))
    unique_names = list(set([item['name'] for item in data if 'name' in item and item['name']]))

    print(f"Translating {len(unique_states)} states...")
    state_translations = translate_batch_fast(unique_states)
    state_map = dict(zip(unique_states, state_translations))

    print(f"Translating {len(unique_names)} names in chunks...")
    name_map = {}
    
    # 50 words per chunk ensures we don't hit max URI length or translation limits
    chunks = list(chunk_list(unique_names, 50))
    for i, batch in enumerate(chunks):
        print(f"Translating batch {i+1}/{len(chunks)}...")
        translated_batch = translate_batch_fast(batch)
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
