import sys
import json
import logging
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

# Setup logging
logging.basicConfig(level=logging.ERROR)

class ParaphraseModel:
    def __init__(self):
        self.model_name = "Vamsi/T5_Paraphrase_Paws"
        self.tokenizer = None
        self.model = None
        self.load_model()
    
    def load_model(self):
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
            
            # Move to GPU if available
            if torch.cuda.is_available():
                self.model = self.model.cuda()
                
        except Exception as e:
            logging.error(f"Failed to load model: {e}")
            raise
    
    def paraphrase(self, text, style="simple", num_alternatives=2):
        try:
            # Adjust input based on style
            input_text = self.prepare_input(text, style)
            input_ids = self.tokenizer.encode(input_text, return_tensors="pt")
            
            # Move to GPU if model is on GPU
            if torch.cuda.is_available() and next(self.model.parameters()).is_cuda:
                input_ids = input_ids.cuda()
            
            # Generate with style-specific parameters
            generation_params = self.get_generation_params(style, num_alternatives)
            
            with torch.no_grad():
                outputs = self.model.generate(input_ids, **generation_params)
            
            results = [self.tokenizer.decode(o, skip_special_tokens=True) for o in outputs]
            
            # Post-process based on style
            results = [self.post_process(result, style) for result in results]
            
            return results
            
        except Exception as e:
            logging.error(f"Paraphrasing failed: {e}")
            return [text]  # Return original text if paraphrasing fails
    
    def prepare_input(self, text, style):
        if style == "formal":
            return f"rewrite this text in a formal way: {text}"
        elif style == "casual":
            return f"rewrite this text in a casual way: {text}"
        elif style == "academic":
            return f"rewrite this text in an academic way: {text}"
        elif style == "creative":
            return f"rewrite this text creatively: {text}"
        else:
            return f"paraphrase: {text}"
    
    def get_generation_params(self, style, num_alternatives):
        base_params = {
            "max_length": 150,
            "num_return_sequences": max(1, num_alternatives),
            "no_repeat_ngram_size": 3,
            "early_stopping": True,
            "do_sample": True,
        }
        
        if style == "creative":
            base_params.update({
                "temperature": 1.5,
                "top_p": 0.8,
                "num_beams": 5,
                "diversity_penalty": 0.5,
            })
        elif style == "formal" or style == "academic":
            base_params.update({
                "temperature": 0.8,
                "top_p": 0.8,
                "num_beams": 5,
            })
        else:
            base_params.update({
                "temperature": 1.2,
                "top_p": 0.85,
                "num_beams": 4,
            })
        
        return base_params
    
    def post_process(self, text, style):
        # Style-specific post-processing
        if style == "formal":
            text = text.replace("can't", "cannot").replace("won't", "will not")
        elif style == "casual":
            text = text.replace("cannot", "can't").replace("will not", "won't")
        
        return text.strip()

# Global model instance (loaded once)
model_instance = None

def get_model():
    global model_instance
    if model_instance is None:
        model_instance = ParaphraseModel()
    return model_instance

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
        model = get_model()
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