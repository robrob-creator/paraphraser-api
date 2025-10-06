#!/usr/bin/env python3
"""
Simple but effective paraphrasing script using rule-based techniques
"""

import sys
import random
import re

class SimpleParaphraser:
    def __init__(self):
        # Word replacement dictionaries
        self.synonyms = {
            'quick': ['fast', 'rapid', 'swift', 'speedy'],
            'brown': ['tan', 'chestnut', 'auburn', 'russet'],
            'jumps': ['leaps', 'bounds', 'springs', 'hops'],
            'lazy': ['idle', 'sluggish', 'inactive', 'lethargic'],
            'dog': ['canine', 'hound', 'pup', 'animal'],
            'nice': ['pleasant', 'lovely', 'beautiful', 'wonderful'],
            'good': ['excellent', 'great', 'fine', 'wonderful'],
            'big': ['large', 'huge', 'enormous', 'massive'],
            'small': ['tiny', 'little', 'petite', 'compact'],
            'happy': ['joyful', 'cheerful', 'delighted', 'pleased'],
            'sad': ['unhappy', 'sorrowful', 'melancholy', 'dejected'],
            'amazing': ['incredible', 'fantastic', 'wonderful', 'remarkable'],
            'beautiful': ['gorgeous', 'stunning', 'lovely', 'attractive'],
            'important': ['crucial', 'vital', 'significant', 'essential'],
            'create': ['build', 'make', 'construct', 'develop'],
            'help': ['assist', 'support', 'aid', 'guide'],
            'think': ['believe', 'consider', 'suppose', 'imagine'],
            'need': ['require', 'must have', 'want', 'demand'],
            'schedule': ['arrange', 'plan', 'organize', 'set up'],
            'discuss': ['talk about', 'examine', 'review', 'consider'],
            'project': ['task', 'assignment', 'work', 'endeavor'],
            'meeting': ['gathering', 'conference', 'session', 'discussion'],
            'weather': ['climate', 'conditions', 'atmosphere', 'environment'],
            'today': ['this day', 'currently', 'at present', 'right now'],
            'movie': ['film', 'picture', 'cinema', 'flick'],
            'absolutely': ['completely', 'totally', 'entirely', 'fully'],
            'people': ['individuals', 'persons', 'folks', 'everyone'],
            'scared': ['frightened', 'afraid', 'terrified', 'alarmed']
        }
        
        # Sentence restructuring patterns
        self.restructure_patterns = [
            # Active to passive transformations
            (r'(\w+) jumps over (\w+)', r'\2 is jumped over by \1'),
            (r'(\w+) was (\w+)', r'\1 happened to be \2'),
            (r'We need to (\w+)', r'It is necessary to \1'),
            (r'(\w+) is (\w+) today', r'Today, \1 appears to be \2'),
        ]
    
    def paraphrase(self, text, style="simple", num_alternatives=2):
        results = []
        
        # Generate primary paraphrase
        primary = self._paraphrase_text(text, style)
        results.append(primary)
        
        # Generate alternatives
        for i in range(num_alternatives - 1):
            alt = self._paraphrase_text(text, style, variation=i+1)
            if alt != primary and alt not in results:
                results.append(alt)
        
        return results
    
    def _paraphrase_text(self, text, style, variation=0):
        # Start with original text
        paraphrased = text.lower()
        
        # Apply synonym replacements based on style
        paraphrased = self._apply_synonyms(paraphrased, style, variation)
        
        # Apply sentence restructuring
        if style in ['creative', 'formal']:
            paraphrased = self._restructure_sentence(paraphrased, style)
        
        # Apply style-specific transformations
        paraphrased = self._apply_style_transformations(paraphrased, style)
        
        # Capitalize first letter and fix spacing
        paraphrased = self._fix_capitalization(paraphrased)
        
        return paraphrased
    
    def _apply_synonyms(self, text, style, variation=0):
        words = text.split()
        result_words = []
        
        for word in words:
            # Remove punctuation for lookup
            clean_word = re.sub(r'[^\w]', '', word.lower())
            punctuation = re.sub(r'[\w]', '', word)
            
            if clean_word in self.synonyms:
                synonyms = self.synonyms[clean_word]
                
                # Choose synonym based on style and variation
                if style == 'creative':
                    # Use more varied synonyms
                    index = (variation * 2) % len(synonyms)
                elif style == 'formal':
                    # Use first (typically more formal) synonym
                    index = min(variation, len(synonyms) - 1)
                else:
                    # Use random but consistent synonym
                    index = variation % len(synonyms)
                
                replacement = synonyms[index] + punctuation
                result_words.append(replacement)
            else:
                result_words.append(word)
        
        return ' '.join(result_words)
    
    def _restructure_sentence(self, text, style):
        for pattern, replacement in self.restructure_patterns:
            if re.search(pattern, text):
                text = re.sub(pattern, replacement, text)
                break  # Only apply one restructuring
        return text
    
    def _apply_style_transformations(self, text, style):
        if style == 'formal':
            # Expand contractions
            text = text.replace("can't", "cannot")
            text = text.replace("won't", "will not")
            text = text.replace("don't", "do not")
            text = text.replace("isn't", "is not")
            # Add formal connectors
            if '. ' in text:
                text = text.replace('. ', '. Furthermore, ', 1)
        
        elif style == 'casual':
            # Contract where possible
            text = text.replace("cannot", "can't")
            text = text.replace("will not", "won't")
            text = text.replace("do not", "don't")
            text = text.replace("is not", "isn't")
            # Add casual connectors
            if '. ' in text:
                text = text.replace('. ', '. Also, ', 1)
        
        elif style == 'creative':
            # Add descriptive words
            text = re.sub(r'\b(fox|dog|animal)\b', r'magnificent \1', text, count=1)
            text = re.sub(r'\b(jumps|leaps|bounds)\b', r'gracefully \1', text, count=1)
        
        return text
    
    def _fix_capitalization(self, text):
        # Capitalize first letter
        if text:
            text = text[0].upper() + text[1:]
        
        # Capitalize after periods
        text = re.sub(r'(\. )([a-z])', lambda m: m.group(1) + m.group(2).upper(), text)
        
        return text

def main():
    if len(sys.argv) < 2:
        print("Error: No input text provided", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Parse arguments
        text = sys.argv[1]
        style = sys.argv[2] if len(sys.argv) > 2 else "simple"
        num_alternatives = int(sys.argv[3]) if len(sys.argv) > 3 else 2
        
        # Create paraphraser and generate results
        paraphraser = SimpleParaphraser()
        results = paraphraser.paraphrase(text, style, num_alternatives)
        
        # Output results (one per line)
        for result in results:
            print(result)
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()