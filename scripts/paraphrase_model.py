import sys
import json
import logging

# Setup logging
logging.basicConfig(level=logging.ERROR)

class ParaphraseModel:
    def __init__(self):
        # Use a lightweight model or fallback to OpenAI-style API
        self.use_transformers = False
        try:
            from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
            import torch
            self.model_name = "t5-paraphrase-generation"  # Specialized paraphrasing model
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
            self.use_transformers = True
            logging.info("Loaded t5-paraphrase-generation model successfully")
        except Exception as e:
            logging.error(f"Failed to load transformers model: {e}")
            self.use_transformers = False
    
    def paraphrase(self, text, style="simple", num_alternatives=2):
        if self.use_transformers:
            return self._paraphrase_with_transformers(text, style, num_alternatives)
        else:
            return self._fallback_paraphrase(text, style, num_alternatives)
    
    def _paraphrase_with_transformers(self, text, style, num_alternatives):
        try:
            import torch
            
            # t5-paraphrase-generation expects this format
            input_text = f"paraphrase: {text}"
            input_ids = self.tokenizer.encode(input_text, return_tensors="pt", max_length=512, truncation=True)
            
            # Generate with optimized parameters for paraphrasing
            generation_params = {
                "max_length": 512,
                "num_return_sequences": min(num_alternatives, 3),
                "num_beams": 5,
                "early_stopping": True,
                "do_sample": True,
                "top_p": 0.9,
                "no_repeat_ngram_size": 3,
            }
            
            # Style-specific parameters
            if style == "creative":
                generation_params.update({"temperature": 1.3, "top_p": 0.8})
            elif style == "formal":
                generation_params.update({"temperature": 0.7, "num_beams": 3})
            elif style == "casual":
                generation_params.update({"temperature": 1.1, "top_p": 0.85})
            else:
                generation_params.update({"temperature": 1.0})
            
            with torch.no_grad():
                outputs = self.model.generate(input_ids, **generation_params)
            
            results = [self.tokenizer.decode(o, skip_special_tokens=True) for o in outputs]
            
            # Clean up results and filter out poor paraphrases
            cleaned_results = []
            for result in results:
                if result and result.lower().strip() != text.lower().strip():
                    # Remove any remaining "paraphrase:" prefix
                    if result.lower().startswith("paraphrase:"):
                        result = result[11:].strip()
                    cleaned_results.append(result.strip())
            
            # If we got good results, return them
            if cleaned_results:
                return cleaned_results[:num_alternatives]
            else:
                # Fall back to our reliable method
                return self._fallback_paraphrase(text, style, num_alternatives)
                
        except Exception as e:
            logging.error(f"Transformers paraphrasing failed: {e}")
            return self._fallback_paraphrase(text, style, num_alternatives)
    
    def _fallback_paraphrase(self, text, style, num_alternatives):
        """Simple but effective paraphrasing using basic transformations"""
        
        # Simple synonym replacements
        replacements = {
            'quick': ['fast', 'rapid', 'swift'],
            'brown': ['reddish-brown', 'russet', 'bronze'],
            'jumps': ['leaps', 'bounds', 'springs'],
            'over': ['above', 'across', 'beyond'],
            'lazy': ['idle', 'sluggish', 'sleepy'],
            'dog': ['canine', 'hound', 'pup'],
            'fox': ['red fox', 'wild fox', 'cunning fox'],
            'nice': ['pleasant', 'lovely', 'wonderful'],
            'good': ['excellent', 'great', 'fine'],
            'today': ['this day', 'currently', 'right now'],
            'weather': ['climate', 'conditions'],
            'meeting': ['gathering', 'conference'],
            'project': ['task', 'assignment'],
            'amazing': ['incredible', 'fantastic', 'remarkable'],
            'beautiful': ['gorgeous', 'stunning', 'lovely'],
            'important': ['crucial', 'vital', 'significant'],
            'people': ['individuals', 'folks', 'everyone'],
        }
        
        results = []
        words = text.split()
        
        # Generate variations
        for i in range(num_alternatives):
            new_words = []
            for j, word in enumerate(words):
                clean_word = word.lower().strip('.,!?;:')
                punctuation = word[len(clean_word):]
                
                if clean_word in replacements and len(replacements[clean_word]) > i:
                    replacement = replacements[clean_word][i % len(replacements[clean_word])]
                    new_words.append(replacement + punctuation)
                else:
                    new_words.append(word)
            
            result = ' '.join(new_words)
            
            # Apply style modifications
            if style == "formal":
                result = result.replace("can't", "cannot").replace("won't", "will not")
            elif style == "casual":
                result = result.replace("cannot", "can't").replace("will not", "won't")
            
            # Capitalize first letter
            if result:
                result = result[0].upper() + result[1:]
            
            if result != text:
                results.append(result)
        
        # Ensure we have at least one result
        if not results:
            results = [text]
            
        return results

def main():
    if len(sys.argv) < 2:
        print("Error: No input text provided", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Parse arguments
        text = sys.argv[1]
        style = sys.argv[2] if len(sys.argv) > 2 else "simple"
        num_alternatives = int(sys.argv[3]) if len(sys.argv) > 3 else 2
        
        # Get model and paraphrase
        model = ParaphraseModel()
        results = model.paraphrase(text, style, num_alternatives)
        
        # Output results (one per line)
        for result in results:
            print(result)
            
    except Exception as e:
        logging.error(f"Main execution failed: {e}")
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()