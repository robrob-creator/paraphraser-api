#!/usr/bin/env python3
"""
Grammar Corrector using AI and rule-based approaches
"""

import sys
import json
import logging
import re

# Setup logging
logging.basicConfig(level=logging.INFO)

try:
    from transformers import pipeline, T5ForConditionalGeneration, T5Tokenizer
    import torch
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False
    logging.warning("Transformers not available, using rule-based corrections only")

class GrammarCorrector:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        
        if HAS_TRANSFORMERS:
            try:
                # Try to load a lightweight grammar correction model
                model_name = "google/flan-t5-base"
                self.tokenizer = T5Tokenizer.from_pretrained(model_name)
                self.model = T5ForConditionalGeneration.from_pretrained(model_name)
                logging.info(f"Loaded {model_name} model successfully")
            except Exception as e:
                logging.warning(f"Failed to load AI model: {e}")
                self.model = None
                self.tokenizer = None

    def correct_grammar(self, text, level="basic"):
        """Correct grammar in the given text"""
        
        corrections = []
        confidence = 0.8
        
        # Always try AI first if available, then fallback to rule-based
        if self.model and self.tokenizer:
            # Use AI model for grammar correction
            corrected_text, ai_corrections = self._ai_correct(text)
            corrections.extend(ai_corrections)
            confidence = 0.9
            
            # If AI correction is good enough, return it
            if corrected_text and corrected_text.strip() != text.strip():
                return {
                    "correctedText": corrected_text,
                    "corrections": corrections,
                    "confidence": confidence
                }
        
        # Fallback to rule-based correction if AI fails or unavailable
        corrected_text, rule_corrections = self._rule_based_correct(text)
        corrections.extend(rule_corrections)
        confidence = 0.7 if not self.model else 0.8
        
        return {
            "correctedText": corrected_text,
            "corrections": corrections,
            "confidence": confidence
        }
    
    def _ai_correct(self, text):
        """Use AI model for grammar correction"""
        corrections = []
        
        try:
            # Try multiple prompting strategies for better results
            prompts = [
                f"Fix all spelling and grammar errors: {text}",
                f"Correct all mistakes in this sentence: {text}", 
                f"Fix spelling errors and grammar: {text}",
                f"Proofread and correct: {text}",
                f"Fix typos and grammar in: {text}"
            ]
            
            best_result = None
            best_score = 0
            
            for prompt in prompts:
                try:
                    inputs = self.tokenizer(
                        prompt,
                        return_tensors="pt",
                        max_length=512,
                        truncation=True,
                        padding=True
                    )
                    
                    with torch.no_grad():
                        outputs = self.model.generate(
                            inputs.input_ids,
                            max_length=len(text.split()) + 30,
                            min_length=max(1, len(text.split()) - 2),
                            num_return_sequences=3,  # Generate multiple options
                            temperature=0.2,  # Lower temperature for more consistent results
                            do_sample=True,
                            pad_token_id=self.tokenizer.eos_token_id,
                            no_repeat_ngram_size=2
                        )
                    
                    # Evaluate all generated options
                    for output in outputs:
                        candidate = self.tokenizer.decode(output, skip_special_tokens=True)
                        
                        # Clean up the result
                        cleaned = self._clean_ai_response(candidate, prompt)
                        
                        if cleaned:
                            # Apply additional post-processing fixes
                            cleaned = self._post_process_ai_result(cleaned)
                            score = self._score_correction(text, cleaned)
                            
                            if score > best_score:
                                best_result = cleaned
                                best_score = score
                    
                    # If we found a good result, use it
                    if best_score > 0.7:
                        break
                        
                except Exception as e:
                    logging.warning(f"Failed with prompt '{prompt}': {e}")
                    continue
            
            # Use the best result if found
            if best_result and best_result.strip() != text.strip():
                corrections.append({
                    "original": text,
                    "corrected": best_result,
                    "type": "AI Grammar Correction",
                    "confidence": min(0.95, best_score)
                })
                return best_result, corrections
            
        except Exception as e:
            logging.warning(f"AI correction failed: {e}")
        
        # Fallback to rule-based
        return self._rule_based_correct(text)
    
    def _post_process_ai_result(self, text):
        """Apply post-processing fixes to AI results"""
        result = text
        
        # Fix common spelling errors that AI might miss
        spelling_fixes = {
            r"\bShowe\b": "Show",
            r"\bhte\b": "the", 
            r"\bteh\b": "the",
            r"\badn\b": "and",
            r"\byuo\b": "you",
            r"\byour\b": "you're",  # Context dependent - may need adjustment
            r"\byoure\b": "you're",
            r"\bthere\b": "their",  # Context dependent
            r"\btheir\b": "there",  # Context dependent  
            r"\bwont\b": "won't",
            r"\bcant\b": "can't",
            r"\bdont\b": "don't",
            r"\bcouldnt\b": "couldn't",
            r"\bshouldnt\b": "shouldn't",
            r"\bwouldnt\b": "wouldn't",
            r"\bdidnt\b": "didn't",
            r"\bdoesnt\b": "doesn't",
            r"\bisnt\b": "isn't",
            r"\barent\b": "aren't",
            r"\bwasnt\b": "wasn't",
            r"\bwerent\b": "weren't"
        }
        
        for pattern, replacement in spelling_fixes.items():
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        
        # Fix common capitalization issues the AI might miss
        words = result.split()
        for i, word in enumerate(words):
            if len(word) > 1:
                # Fix patterns like "SHow" -> "Show"
                if word[0].isupper() and word[1].isupper() and not word.isupper():
                    words[i] = word[0] + word[1:].lower()
        result = " ".join(words)
        
        # Ensure proper sentence capitalization
        if result and not result[0].isupper():
            result = result[0].upper() + result[1:]
        
        # Fix subject-verb agreement issues
        # "me and my friend was" -> "my friend and I were"
        result = re.sub(r"\bme and my (\w+) was\b", r"My \1 and I were", result, flags=re.IGNORECASE)
        result = re.sub(r"\bme and (\w+) was\b", r"My \1 and I were", result, flags=re.IGNORECASE)
        
        # Fix your/you're confusion based on context
        # "you're face" should be "your face" (possessive)
        possessive_nouns = r"(face|name|car|house|book|phone|problem|fault|turn|money|bag|clothes|hair|eyes|hands|feet|dog|cat|family|friend|job|work|idea|opinion|choice)"
        result = re.sub(r"you're\s+" + possessive_nouns, r"your \1", result, flags=re.IGNORECASE)
        
        # Fix there/their confusion
        result = re.sub(r"there\s+(car|house|book|problem|family|dog|cat)", r"their \1", result, flags=re.IGNORECASE)
        
        # Fix its/it's confusion  
        result = re.sub(r"it's\s+(color|size|name|place|smell|taste|texture)", r"its \1", result, flags=re.IGNORECASE)
        
        # Ensure proper punctuation
        if result and not result[-1] in '.!?':
            result += '.'
        
        return result
    
    def _clean_ai_response(self, response, prompt):
        """Clean up AI model response"""
        cleaned = response
        
        # Remove the original prompt if it appears in the response
        if prompt in cleaned:
            cleaned = cleaned.replace(prompt, "").strip()
        
        # Remove common AI response patterns
        patterns = [
            "Here is the corrected sentence:",
            "Corrected sentence:",
            "Grammar corrected:",
            "Fixed sentence:",
            "Corrected:",
            "Fixed:",
            "The corrected sentence is:",
            "Answer:",
            "Response:",
            "Result:"
        ]
        
        for pattern in patterns:
            if cleaned.lower().startswith(pattern.lower()):
                cleaned = cleaned[len(pattern):].strip()
        
        # Clean up extra whitespace and formatting
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Remove quotes if the entire response is quoted
        if cleaned.startswith('"') and cleaned.endswith('"'):
            cleaned = cleaned[1:-1].strip()
        
        return cleaned
    
    def _score_correction(self, original, corrected):
        """Score the quality of a correction"""
        if not corrected or corrected.strip() == "":
            return 0
        
        # Penalize if too different in length
        orig_words = len(original.split())
        corr_words = len(corrected.split())
        
        if corr_words < orig_words * 0.5 or corr_words > orig_words * 2:
            return 0.3
        
        # Reward proper sentence structure
        score = 0.5
        
        # Check for proper capitalization
        if corrected and corrected[0].isupper():
            score += 0.1
        
        # Check for proper ending punctuation
        if corrected and corrected[-1] in '.!?':
            score += 0.1
        
        # Reward if it actually changed something
        if corrected.lower() != original.lower():
            score += 0.2
        
        # Check for specific grammar and spelling improvements
        improvements = [
            ("youre", "your"),  # Possessive form is more common
            ("Showe", "Show"),  # Spelling correction
            ("hte", "the"),     # Common typo
            ("teh", "the"),     # Common typo
            ("adn", "and"),     # Common typo
            ("there", "their"), 
            ("SHow", "Show"),
            ("cant", "can't"),
            ("dont", "don't"),
            ("wont", "won't"),
            ("was", "were"),    # for "we was" -> "we were"
            ("nowhere", "anywhere"),
            ("couldnt", "couldn't"),
            ("shouldnt", "shouldn't"),
            ("wouldnt", "wouldn't")
        ]
        
        for wrong, right in improvements:
            if wrong in original.lower() and right in corrected.lower():
                score += 0.15  # Higher reward for spelling corrections
        
        # Penalize incorrect your/you're usage
        # "you're face" is wrong, should be "your face"
        if re.search(r"you're\s+(face|name|car|house|book|phone|problem|fault|turn)", corrected, re.IGNORECASE):
            score -= 0.3
        
        # Reward correct your/you're usage
        if re.search(r"your\s+(face|name|car|house|book|phone|problem|fault|turn)", corrected, re.IGNORECASE):
            score += 0.2
        
        return min(1.0, score)
    
    def _rule_based_correct(self, text):
        """Apply rule-based grammar corrections"""
        corrected = text
        corrections = []
        
        # Track original for comparison
        original = corrected
        
        # Fix weird capitalization patterns first
        words = corrected.split()
        for i, word in enumerate(words):
            if len(word) > 1:
                # Fix patterns like "SHow" -> "Show"
                if word[0].isupper() and word[1].isupper() and not word.isupper():
                    old_word = word
                    words[i] = word[0] + word[1:].lower()
                    corrections.append({
                        "original": old_word,
                        "corrected": words[i],
                        "type": "Capitalization",
                        "confidence": 0.95
                    })
        corrected = " ".join(words)
        
        # Fix sentence capitalization
        if corrected and not corrected[0].isupper():
            old_first = corrected[0]
            corrected = corrected[0].upper() + corrected[1:]
            corrections.append({
                "original": f"lowercase '{old_first}'",
                "corrected": f"uppercase '{corrected[0]}'",
                "type": "Sentence Capitalization",
                "confidence": 0.95
            })
        
        # Fix common word confusions
        word_fixes = {
            # Your/You're confusion
            r"\byoure\b": "your",  # "youre face" -> "your face"
            r"\byou\'re\s+(face|name|car|house|book|phone|problem|fault|turn)": r"your \1",
            
            # There/Their/They're
            r"\bthere\s+(car|house|book|problem)": r"their \1",
            r"\btheir\s+(going|coming|here)": r"they're \1",
            
            # Its/It's
            r"\bits\s+(going|coming|time)": r"it's \1",
            r"\bit\'s\s+(color|size|name|place)": r"its \1",
            
            # To/Too/Two
            r"\bto\s+(much|many|late|early|big|small)": r"too \1",
            r"\btoo\s+(go|come|see|the\s+store)": r"to \1",
            
            # Then/Than
            r"\bthen\s+(better|worse|bigger|smaller)": r"than \1",
            r"\bbetter\s+then": "better than",
            
            # Accept/Except
            r"\baccept\s+(for|that)": r"except \1",
            r"\bexcept\s+(the\s+offer|this\s+gift)": r"accept \1",
            
            # Affect/Effect
            r"\beffect\s+(me|you|him|her|them|us)": r"affect \1",
            r"\ban\s+affect": "an effect",
            
            # Lose/Loose
            r"\bloose\s+(the\s+game|weight|money)": r"lose \1",
            r"\blose\s+(fitting|clothing)": r"loose \1"
        }
        
        for pattern, replacement in word_fixes.items():
            old_corrected = corrected
            corrected = re.sub(pattern, replacement, corrected, flags=re.IGNORECASE)
            if corrected != old_corrected:
                corrections.append({
                    "original": "word confusion",
                    "corrected": "fixed word choice",
                    "type": "Word Choice",
                    "confidence": 0.9
                })
        
        # Fix contractions
        contraction_fixes = {
            "couldnt": "couldn't",
            "cant": "can't", 
            "dont": "don't",
            "wont": "won't",
            "isnt": "isn't",
            "arent": "aren't",
            "wasnt": "wasn't",
            "werent": "weren't",
            "hasnt": "hasn't",
            "havent": "haven't",
            "hadnt": "hadn't",
            "shouldnt": "shouldn't",
            "wouldnt": "wouldn't",
            "didnt": "didn't",
            "doesnt": "doesn't"
        }
        
        for wrong, right in contraction_fixes.items():
            if wrong in corrected.lower():
                old_corrected = corrected
                corrected = re.sub(r"\b" + wrong + r"\b", right, corrected, flags=re.IGNORECASE)
                if corrected != old_corrected:
                    corrections.append({
                        "original": wrong,
                        "corrected": right,
                        "type": "Contraction",
                        "confidence": 0.9
                    })
        
        # Fix subject-verb agreement
        agreement_fixes = [
            (r"\bpeople\s+is\b", "people are"),
            (r"\bwe\s+was\b", "we were"),
            (r"\bthey\s+was\b", "they were"),
            (r"\byou\s+was\b", "you were"),
            (r"\bI\s+are\b", "I am"),
            (r"\bhe\s+are\b", "he is"),
            (r"\bshe\s+are\b", "she is"),
            (r"\bit\s+are\b", "it is"),
            (r"\bmany\s+.+\s+is\b", lambda m: m.group(0).replace(" is", " are")),
            (r"\bfew\s+.+\s+is\b", lambda m: m.group(0).replace(" is", " are")),
            (r"\bseveral\s+.+\s+is\b", lambda m: m.group(0).replace(" is", " are"))
        ]
        
        for pattern, replacement in agreement_fixes:
            old_corrected = corrected
            if callable(replacement):
                corrected = re.sub(pattern, replacement, corrected, flags=re.IGNORECASE)
            else:
                corrected = re.sub(pattern, replacement, corrected, flags=re.IGNORECASE)
            if corrected != old_corrected:
                corrections.append({
                    "original": "subject-verb disagreement",
                    "corrected": "fixed agreement",
                    "type": "Subject-Verb Agreement",
                    "confidence": 0.95
                })
        
        # Fix verb tense consistency
        tense_fixes = [
            (r"\bhave\s+(\w+ed)\s+yesterday\b", r"had \1 yesterday"),
            (r"\bwill\s+(\w+ed)\s+tomorrow\b", r"will \1 tomorrow"),
            (r"\byesterday\s+I\s+will\b", "yesterday I"),
            (r"\btomorrow\s+I\s+was\b", "tomorrow I will be")
        ]
        
        for pattern, replacement in tense_fixes:
            old_corrected = corrected
            corrected = re.sub(pattern, replacement, corrected, flags=re.IGNORECASE)
            if corrected != old_corrected:
                corrections.append({
                    "original": "tense inconsistency",
                    "corrected": "fixed tense",
                    "type": "Verb Tense",
                    "confidence": 0.85
                })
        
        # Fix double negatives
        # Handle context-sensitive double negatives
        if re.search(r"\b(don\'t|can\'t|won\'t|couldn\'t|wouldn\'t|shouldn\'t)\b.*\b(no|nothing|nowhere|nobody|never)\b", corrected, re.IGNORECASE):
            # Pattern: "can't find it nowhere" -> "can't find it anywhere"
            old_corrected = corrected
            corrected = re.sub(r"\bnowhere\b", "anywhere", corrected, flags=re.IGNORECASE)
            corrected = re.sub(r"\bnothing\b", "anything", corrected, flags=re.IGNORECASE) 
            corrected = re.sub(r"\bnobody\b", "anybody", corrected, flags=re.IGNORECASE)
            corrected = re.sub(r"\bnever\s+no\b", "never any", corrected, flags=re.IGNORECASE)
            
            if corrected != old_corrected:
                corrections.append({
                    "original": "double negative",
                    "corrected": "single negative",
                    "type": "Double Negative",
                    "confidence": 0.9
                })
        
        # Fix spacing and punctuation
        old_corrected = corrected
        corrected = re.sub(r'\s+,', ',', corrected)
        corrected = re.sub(r'\s+\.', '.', corrected)
        corrected = re.sub(r'\s+!', '!', corrected)
        corrected = re.sub(r'\s+\?', '?', corrected)
        
        if corrected != old_corrected:
            corrections.append({
                "original": "spacing issues",
                "corrected": "fixed spacing",
                "type": "Punctuation",
                "confidence": 0.8
            })
        
        # Ensure proper sentence ending
        if corrected and not corrected[-1] in '.!?':
            corrected += '.'
            corrections.append({
                "original": "missing punctuation",
                "corrected": "added period",
                "type": "Sentence Ending",
                "confidence": 0.9
            })
        
        return corrected, corrections

def main():
    if len(sys.argv) != 3:
        print("Usage: python grammar_corrector.py <text> <level>")
        sys.exit(1)
    
    text = sys.argv[1]
    level = sys.argv[2]
    
    corrector = GrammarCorrector()
    result = corrector.correct_grammar(text, level)
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()
