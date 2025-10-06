import sys
import json
import logging
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

# Setup logging
logging.basicConfig(level=logging.ERROR)

class ParaphraseModel:
    def __init__(self):
        # Use a proven paraphrasing model
        self.model_name = "ramsrigouthamg/t5_paraphraser"
        self.tokenizer = None
        self.model = None
        self.load_model()
    
    def load_model(self):
        try:
            from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
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
        # This model expects specific format
        return f"paraphrase: {text} </s>"
    
    def get_generation_params(self, style, num_alternatives):
        # Optimized parameters for T5 paraphrasing model
        base_params = {
            "max_length": 128,
            "min_length": 10,
            "num_return_sequences": max(1, num_alternatives),
            "num_beams": 4,
            "early_stopping": True,
            "do_sample": False,  # Use beam search for more consistent results
        }
        
        if style == "creative":
            # Add some sampling for creativity
            base_params.update({
                "do_sample": True,
                "temperature": 1.2,
                "top_p": 0.8,
                "num_beams": 6,
            })
        elif style == "formal":
            # More conservative beam search
            base_params.update({
                "num_beams": 3,
                "length_penalty": 1.2,
            })
        elif style == "casual":
            # Balanced approach
            base_params.update({
                "do_sample": True,
                "temperature": 1.0,
                "top_p": 0.9,
                "num_beams": 4,
            })
        
        return base_params
    
    def post_process(self, text, style):
        # Clean up the text first
        text = text.strip()
        
        # Style-specific post-processing
        if style == "formal":
            # Convert contractions to full forms for formal style
            text = text.replace("can't", "cannot")
            text = text.replace("won't", "will not") 
            text = text.replace("don't", "do not")
            text = text.replace("isn't", "is not")
            text = text.replace("aren't", "are not")
            text = text.replace("wasn't", "was not")
            text = text.replace("weren't", "were not")
            text = text.replace("haven't", "have not")
            text = text.replace("hasn't", "has not")
            text = text.replace("hadn't", "had not")
            text = text.replace("shouldn't", "should not")
            text = text.replace("wouldn't", "would not")
            text = text.replace("couldn't", "could not")
            
        elif style == "casual":
            # Convert to contractions for casual style
            text = text.replace("cannot", "can't")
            text = text.replace("will not", "won't")
            text = text.replace("do not", "don't")
            text = text.replace("is not", "isn't")
            text = text.replace("are not", "aren't")
            text = text.replace("was not", "wasn't")
            text = text.replace("were not", "weren't")
            text = text.replace("have not", "haven't")
            text = text.replace("has not", "hasn't")
            text = text.replace("had not", "hadn't")
            text = text.replace("should not", "shouldn't")
            text = text.replace("would not", "wouldn't")
            text = text.replace("could not", "couldn't")
        
        return text

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