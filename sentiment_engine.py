import sys
import json
import torch
from transformers import pipeline

def main():
    # Load model once on startup
    # Using a lightweight but effective multilingual or Czech model.
    # UWB-AIR/w2v-bert-2.0-sentiment is good but might require authentication or be large.
    # 'Seznam/small-e-czech' is good for general purpose, but sentiment specific is better.
    # Let's use a standard multilingual sentiment model that works reasonably well and is open.
    # "nlptown/bert-base-multilingual-uncased-sentiment" is popular and supports many languages including Czech implicitly.
    # Or specifically "fav-kky/bert-czech-sentiment" (if available publicly without restricted access).
    
    # Let's try "nlptown/bert-base-multilingual-uncased-sentiment" - it gives star ratings 1-5.
    model_name = "nlptown/bert-base-multilingual-uncased-sentiment"
    
    try:
        sentiment_pipeline = pipeline("sentiment-analysis", model=model_name)
    except Exception as e:
        # Fallback error reporting
        print(json.dumps({"error": str(e)}), flush=True)
        return

    print("READY", flush=True) # Signal to Node that we are ready

    for line in sys.stdin:
        try:
            line = line.strip()
            if not line:
                continue
            
            # Analyze
            result = sentiment_pipeline(line)[0]
            # Result is like {'label': '5 stars', 'score': 0.85}
            
            # Convert 1-5 stars to -1 to 1 score roughly
            label = result['label']
            score = result['score'] # Confidence
            
            star_rating = int(label.split()[0]) # '1 stars' -> 1
            
            # Mapping:
            # 1 star -> -2
            # 2 stars -> -1
            # 3 stars -> 0
            # 4 stars -> 1
            # 5 stars -> 2
            
            final_score = 0
            if star_rating == 1: final_score = -2
            elif star_rating == 2: final_score = -1
            elif star_rating == 3: final_score = 0
            elif star_rating == 4: final_score = 1
            elif star_rating == 5: final_score = 2
            
            # Output JSON
            print(json.dumps({"score": final_score, "confidence": score}), flush=True)
            
        except Exception as e:
            print(json.dumps({"error": str(e)}), flush=True)

if __name__ == "__main__":
    main()
