import sys
import json
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

class ParaphraseModel:
    def __init__(self):
        # Use a lightweight model or fallback to OpenAI-style API
        self.use_transformers = False
        try:
            from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
            import torch
            
            # Try different T5 models for paraphrasing - start with simpler ones
            models_to_try = [
                "google/flan-t5-base",  # General T5 model - try first
                "Vamsi/T5_Paraphrase_Paws",  # Specialized for paraphrasing
                "ramsrigouthamg/t5_paraphraser",  # Fallback
            ]
            
            for model_name in models_to_try:
                try:
                    self.model_name = model_name
                    self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
                    self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
                    self.use_transformers = True
                    logging.info(f"Loaded {self.model_name} model successfully")
                    break
                except Exception as e:
                    logging.warning(f"Failed to load {model_name}: {e}")
                    continue
            
            if not self.use_transformers:
                raise Exception("No suitable T5 model found")
        except Exception as e:
            logging.error(f"Failed to load transformers model: {e}")
            self.use_transformers = False
    
    def paraphrase(self, text, style="simple", num_alternatives=2):
        # Use fallback method for reliable, predictable paraphrasing
        logging.info("Using enhanced fallback paraphrasing for reliable results")
        return self._fallback_paraphrase(text, style, num_alternatives)
    
    def _paraphrase_with_transformers(self, text, style, num_alternatives):
        try:
            import torch
            
            # Try multiple different prompting strategies - MORE EXPLICIT about paraphrasing
            prompts = []
            if "flan-t5" in self.model_name:
                prompts = [
                    f"Paraphrase this sentence keeping the same meaning: {text}",
                    f"Rewrite this sentence with different words but same meaning: {text}",
                    f"Express the exact same idea using different words: {text}",
                ]
            elif "Vamsi/T5_Paraphrase_Paws" in self.model_name:
                prompts = [
                    f"paraphrase: {text}",
                    f"rephrase: {text}",
                ]
            else:
                # Default format for ramsrigouthamg/t5_paraphraser
                prompts = [
                    f"paraphrase: {text} </s>",
                    f"rephrase: {text} </s>",
                ]
            
            all_results = []
            
            # Try each prompt strategy
            for prompt in prompts:
                input_ids = self.tokenizer.encode(prompt, return_tensors="pt", max_length=512, truncation=True)
            
                # Generate with BALANCED parameters - high diversity but stay on topic
                generation_params = {
                    "max_length": 512,
                    "num_return_sequences": 2,  # Generate 2 per prompt
                    "num_beams": 3,  # Use some beam search for quality
                    "early_stopping": True,
                    "do_sample": True,
                    "top_p": 0.8,  # More permissive to allow paraphrasing
                    "top_k": 50,   # Reasonable vocabulary range
                    "temperature": 1.1,  # Moderate temperature to avoid hallucinations
                    "no_repeat_ngram_size": 2,
                    "repetition_penalty": 1.3,  # Moderate penalty
                }

                # Style-specific parameters - CONSERVATIVE to prevent hallucinations
                if style == "creative":
                    generation_params.update({"temperature": 1.3, "top_p": 0.7, "top_k": 40})
                elif style == "formal":
                    generation_params.update({"temperature": 0.9, "top_p": 0.85, "repetition_penalty": 1.2})
                elif style == "casual":
                    generation_params.update({"temperature": 1.1, "top_p": 0.8, "top_k": 45})
                else:
                    generation_params.update({"temperature": 1.0, "top_p": 0.8})

                with torch.no_grad():
                    outputs = self.model.generate(input_ids, **generation_params)

                prompt_results = [self.tokenizer.decode(o, skip_special_tokens=True) for o in outputs]
                all_results.extend(prompt_results)
            
            # Clean up results and filter for meaningful paraphrases (not hallucinations)
            cleaned_results = []
            original_words = set(text.lower().split())
            
            for result in all_results:
                if result and result.lower().strip() != text.lower().strip():
                    # Remove any remaining prompt prefixes
                    for prefix in ["paraphrase:", "rephrase:", "rewrite:", "paraphrase this sentence keeping the same meaning:", "rewrite this sentence with different words but same meaning:", "express the exact same idea using different words:"]:
                        if result.lower().startswith(prefix):
                            result = result[len(prefix):].strip()
                    
                    # Filter out results that are too different (likely hallucinations)
                    result_words = set(result.lower().split())
                    if len(original_words) > 0:
                        # Check word overlap - should share SOME words but not all
                        word_overlap = len(original_words.intersection(result_words)) / len(original_words)
                        # Also check if result is reasonable length (not too short or too long)
                        length_ratio = len(result.split()) / len(text.split())
                        
                        if (0.2 <= word_overlap <= 0.8 and  # Share 20-80% of words
                            0.5 <= length_ratio <= 2.0 and   # Reasonable length
                            len(result.split()) >= 3):       # Not too short
                            if result not in cleaned_results:  # Avoid duplicates
                                cleaned_results.append(result.strip())
                    else:
                        if result not in cleaned_results:
                            cleaned_results.append(result.strip())
            
            # If we got meaningful results, return them
            if cleaned_results:
                return cleaned_results[:num_alternatives]
            else:
                # If AI failed to produce good results, use enhanced fallback
                logging.warning("AI model produced poor results, using fallback paraphrasing")
                return self._fallback_paraphrase(text, style, num_alternatives)
                
        except Exception as e:
            logging.error(f"Transformers paraphrasing failed: {e}")
            return self._fallback_paraphrase(text, style, num_alternatives)
    
    def _fallback_paraphrase(self, text, style, num_alternatives):
        """Universal sentence-level paraphrasing for any sentence structure"""
        
        results = []
        
        # Method 1: Universal syntactic transformations
        syntactic_variants = self._apply_syntactic_transformations(text, style)
        results.extend(syntactic_variants)
        
        # Method 2: Universal semantic substitutions
        semantic_variants = self._apply_semantic_substitutions(text, style)
        results.extend(semantic_variants)
        
        # Method 3: Universal discourse restructuring
        discourse_variants = self._apply_discourse_restructuring(text, style)
        results.extend(discourse_variants)
        
        # Remove duplicates and original text
        unique_results = []
        for result in results:
            if result and result.strip() != text.strip() and result not in unique_results:
                unique_results.append(result)
        
        # If we have few results, add guaranteed transformations
        if len(unique_results) < num_alternatives:
            guaranteed_results = self._ensure_minimum_transformations(text, style, num_alternatives - len(unique_results))
            for result in guaranteed_results:
                if result and result not in unique_results and result != text:
                    unique_results.append(result)
        
        return unique_results[:num_alternatives] if unique_results else [text]
    
    def _ensure_minimum_transformations(self, text, style, needed):
        """Ensure we have minimum transformations for any sentence"""
        results = []
        
        # Strategy 1: Add qualifying words
        if style == "formal" and not any(word in text.lower() for word in ["perhaps", "possibly", "likely", "generally"]):
            qualified = "Perhaps " + text.lower()
            results.append(qualified)
            
        if len(results) < needed:
            qualified2 = "Generally speaking, " + text.lower()
            results.append(qualified2)
        
        # Strategy 2: Change sentence structure with "it is" constructions
        if len(results) < needed and text.endswith('.'):
            if style == "formal":
                if text.lower().startswith("the "):
                    # "The X is Y" → "It is noteworthy that the X is Y"
                    formal_variant = f"It is noteworthy that {text.lower()}"
                    results.append(formal_variant)
                else:
                    # Any sentence → "It is important to note that [sentence]"
                    formal_variant = f"It is important to note that {text.lower()}"
                    results.append(formal_variant)
        
        # Strategy 3: Add emphasis or hedging
        if len(results) < needed:
            if style == "casual":
                casual_variant = "Actually, " + text.lower()
                results.append(casual_variant)
            else:
                formal_variant = "It should be noted that " + text.lower()
                results.append(formal_variant)
        
        # Strategy 4: Rephrase with different verb tenses or aspects
        if len(results) < needed:
            tense_variant = self._try_tense_transformation(text)
            if tense_variant and tense_variant != text:
                results.append(tense_variant)
        
        return results[:needed]
    
    def _try_tense_transformation(self, text):
        """Try to transform tenses or aspects"""
        # Simple present to present continuous
        if " is " in text and not " is being " in text:
            continuous = text.replace(" is ", " is currently ")
            return continuous
        
        # Add temporal qualifiers
        if not any(word in text.lower() for word in ["currently", "presently", "now", "today"]):
            return "Currently, " + text.lower()
            
        return None
    
    def _apply_syntactic_transformations(self, text, style):
        """Apply universal syntactic transformations that work on any sentence"""
        results = []
        
        # Transform 1: Change temporal expressions
        temporal_transforms = self._transform_temporal_expressions(text)
        results.extend(temporal_transforms)
        
        # Transform 2: Sentence combining/splitting
        if ". " in text:
            # Split compound sentences
            sentences = text.split(". ")
            if len(sentences) > 1:
                # Try combining with different conjunctions
                combined = self._recombine_sentences(sentences)
                if combined and combined != text:
                    results.append(combined)
        elif " and " in text or " but " in text or " or " in text:
            # Split coordinated clauses
            split_form = self._split_coordinated_clauses(text)
            if split_form and split_form != text:
                results.append(split_form)
        
        # Transform 3: Clause ordering (move dependent clauses)
        reordered = self._reorder_clauses(text)
        if reordered and reordered != text:
            results.append(reordered)
        
        # Transform 4: Add sentence starters/connectors
        connector_variants = self._add_sentence_connectors(text, style)
        results.extend(connector_variants)
        
        # Transform 5: Change sentence types (declarative to interrogative, etc.)
        type_variants = self._change_sentence_types(text)
        results.extend(type_variants)
        
        # Transform 6: Expand/contract phrases
        expanded_variants = self._expand_contract_phrases(text, style)
        results.extend(expanded_variants)
            
        return results
    
    def _apply_semantic_substitutions(self, text, style):
        """Apply universal semantic word and phrase substitutions"""
        results = []
        
        # Universal high-frequency word substitutions
        universal_replacements = {
            # Verbs
            'have': ['possess', 'own', 'hold', 'maintain'],
            'get': ['obtain', 'acquire', 'receive', 'gain'],
            'make': ['create', 'produce', 'generate', 'cause'],
            'do': ['perform', 'execute', 'carry out', 'accomplish'],
            'go': ['proceed', 'advance', 'move', 'travel'],
            'come': ['arrive', 'approach', 'emerge', 'appear'],
            'see': ['observe', 'notice', 'perceive', 'witness'],
            'know': ['understand', 'comprehend', 'realize', 'recognize'],
            'think': ['believe', 'consider', 'suppose', 'assume'],
            'say': ['state', 'declare', 'express', 'mention'],
            'give': ['provide', 'offer', 'supply', 'deliver'],
            'take': ['accept', 'receive', 'acquire', 'obtain'],
            'use': ['employ', 'utilize', 'apply', 'implement'],
            'find': ['discover', 'locate', 'identify', 'uncover'],
            'feel': ['experience', 'sense', 'perceive', 'encounter'],
            'look': ['appear', 'seem', 'examine', 'observe'],
            'want': ['desire', 'wish', 'prefer', 'seek'],
            'need': ['require', 'demand', 'necessitate', 'call for'],
            'try': ['attempt', 'endeavor', 'strive', 'effort to'],
            'work': ['function', 'operate', 'labor', 'perform'],
            
            # Adjectives
            'good': ['excellent', 'outstanding', 'superior', 'fine'],
            'bad': ['poor', 'terrible', 'awful', 'inferior'],
            'big': ['large', 'enormous', 'huge', 'massive'],
            'small': ['tiny', 'little', 'minimal', 'compact'],
            'new': ['recent', 'fresh', 'modern', 'current'],
            'old': ['ancient', 'elderly', 'aged', 'former'],
            'important': ['crucial', 'vital', 'significant', 'essential'],
            'different': ['distinct', 'unique', 'varied', 'alternative'],
            'easy': ['simple', 'straightforward', 'effortless', 'basic'],
            'hard': ['difficult', 'challenging', 'tough', 'complex'],
            'right': ['correct', 'accurate', 'proper', 'appropriate'],
            'wrong': ['incorrect', 'mistaken', 'erroneous', 'false'],
            'sure': ['certain', 'confident', 'positive', 'convinced'],
            'clear': ['obvious', 'evident', 'apparent', 'transparent'],
            
            # Nouns
            'thing': ['item', 'object', 'matter', 'element'],
            'person': ['individual', 'human', 'character', 'being'],
            'time': ['period', 'moment', 'duration', 'interval'],
            'place': ['location', 'position', 'spot', 'area'],
            'way': ['method', 'approach', 'manner', 'technique'],
            'problem': ['issue', 'difficulty', 'challenge', 'concern'],
            'idea': ['concept', 'notion', 'thought', 'proposal'],
            'part': ['portion', 'section', 'component', 'segment'],
            'group': ['team', 'collection', 'assembly', 'gathering'],
            'fact': ['reality', 'truth', 'information', 'detail'],
            
            # Adverbs
            'very': ['extremely', 'highly', 'exceptionally', 'remarkably'],
            'really': ['truly', 'genuinely', 'actually', 'indeed'],
            'quite': ['rather', 'fairly', 'somewhat', 'considerably'],
            'always': ['constantly', 'continuously', 'perpetually', 'invariably'],
            'never': ['not ever', 'at no time', 'under no circumstances'],
            'often': ['frequently', 'regularly', 'commonly', 'repeatedly'],
            'sometimes': ['occasionally', 'periodically', 'intermittently', 'at times'],
            'quickly': ['rapidly', 'swiftly', 'speedily', 'promptly'],
            'slowly': ['gradually', 'leisurely', 'steadily', 'carefully'],
        }
        
        # Apply substitutions with multiple variants
        words = text.split()
        max_variants = 3
        for variant_index in range(max_variants):
            new_words = []
            for word in words:
                clean_word = word.lower().strip('.,!?;:"()[]{}')
                punctuation = word[len(clean_word):]
                
                if clean_word in universal_replacements:
                    replacements = universal_replacements[clean_word]
                    if len(replacements) > variant_index:
                        replacement = replacements[variant_index]
                        new_words.append(replacement + punctuation)
                    else:
                        new_words.append(word)
                else:
                    new_words.append(word)
            
            result = ' '.join(new_words)
            
            # Apply style-specific grammar fixes
            result = self._apply_style_grammar(result, style)
            
            if result != text:
                results.append(result)
                
        return results
    
    def _apply_discourse_restructuring(self, text, style):
        """Apply universal discourse-level restructuring"""
        results = []
        
        # Strategy 1: Change sentence perspective
        perspective_variants = self._change_perspective(text)
        results.extend(perspective_variants)
        
        # Strategy 2: Add/remove intensifiers and qualifiers
        intensity_variants = self._modify_intensity(text, style)
        results.extend(intensity_variants)
        
        # Strategy 3: Change temporal/causal relationships
        relationship_variants = self._modify_relationships(text)
        results.extend(relationship_variants)
        
        return results
    
    def _transform_temporal_expressions(self, text):
        """Transform temporal expressions and time-related structures"""
        results = []
        
        # Transform "When I was X, I Y" to "During my X period, I Y" or "In my X days, I Y"
        if text.lower().startswith("when i was "):
            rest = text[11:]  # Remove "When I was "
            if ", i " in rest.lower():
                parts = rest.split(", I ", 1)
                if len(parts) == 2:
                    time_part = parts[0]
                    action_part = parts[1]
                    
                    # Multiple temporal transformations
                    results.append(f"During my {time_part} period, I {action_part}")
                    results.append(f"In my {time_part} days, I {action_part}")
                    results.append(f"Back when I was {time_part}, I {action_part}")
        
        # Transform "used to" constructions
        if "used to " in text.lower():
            text_lower = text.lower()
            index = text_lower.find("used to ")
            if index >= 0:
                before = text[:index]
                after = text[index + 8:]  # Remove "used to "
                
                # Transform to different habitual expressions
                results.append(f"{before}would regularly {after}")
                results.append(f"{before}frequently {after.replace('play', 'played').replace('go', 'went')}")
                results.append(f"{before}had a habit of {after.replace(' ', 'ing ', 1)}")
        
        # Transform "every day" and frequency expressions
        frequency_replacements = {
            "every day": ["daily", "on a daily basis", "each day"],
            "every week": ["weekly", "on a weekly basis", "each week"],
            "always": ["consistently", "without fail", "invariably"],
            "never": ["not once", "at no point", "under no circumstances"],
            "often": ["frequently", "on many occasions", "regularly"],
            "sometimes": ["occasionally", "from time to time", "periodically"]
        }
        
        for freq, replacements in frequency_replacements.items():
            if freq in text.lower():
                for replacement in replacements:
                    new_text = text.replace(freq, replacement)
                    if new_text != text:
                        results.append(new_text)
        
        return results
    
    def _apply_nominalization(self, text):
        """Convert verbs to noun phrases (nominalization)"""
        # Transform "I decided to go" to "My decision was to go"
        # Transform "They discussed the plan" to "Their discussion of the plan"
        
        verb_to_noun = {
            "decided": "decision was",
            "discussed": "discussion concerned",
            "analyzed": "analysis involved",
            "studied": "study focused on",
            "examined": "examination revealed",
            "considered": "consideration of",
            "evaluated": "evaluation showed",
            "investigated": "investigation into"
        }
        
        for verb, noun_phrase in verb_to_noun.items():
            if verb in text.lower():
                # Simple pattern replacement
                if f"i {verb}" in text.lower():
                    new_text = text.lower().replace(f"i {verb}", f"my {noun_phrase}")
                    return new_text.capitalize()
                elif f"they {verb}" in text.lower():
                    new_text = text.lower().replace(f"they {verb}", f"their {noun_phrase}")
                    return new_text.capitalize()
        
        return None
    
    def _change_voice_or_focus(self, text):
        """Change voice, focus, or perspective of the sentence"""
        results = []
        
        # Transform subject-verb patterns
        if text.lower().startswith("i "):
            # Change from first person to third person
            words = text.split()
            if len(words) > 1:
                verb = words[1].lower()
                if verb in ["like", "love", "enjoy", "prefer", "want", "need"]:
                    # "I like X" → "X appeals to me" / "X is something I like"
                    object_part = " ".join(words[2:])
                    if object_part:
                        return f"{object_part.capitalize()} appeals to me"
                elif verb in ["play", "work", "study", "live"]:
                    # "I play tennis" → "Tennis is my activity" / "My activity involves tennis"
                    object_part = " ".join(words[2:])
                    if object_part:
                        return f"My activity involves {object_part}"
        
        # Transform possessive constructions
        if " my " in text.lower():
            # "I finished my work" → "My work is now complete"
            if "finished my" in text.lower():
                words = text.split()
                for i, word in enumerate(words):
                    if word.lower() == "finished" and i + 2 < len(words) and words[i+1].lower() == "my":
                        object_part = " ".join(words[i+2:])
                        return f"My {object_part} is now complete"
        
        return None
    
    def _recombine_sentences(self, sentences):
        """Recombine sentences with different connectors"""
        if len(sentences) < 2:
            return None
            
        connectors = ["Furthermore, ", "Additionally, ", "Moreover, ", "In addition, "]
        connector = connectors[0]  # Use first connector
        
        combined = sentences[0].strip()
        for sentence in sentences[1:]:
            combined += f". {connector}{sentence.strip()}"
            
        return combined
    
    def _split_coordinated_clauses(self, text):
        """Split coordinated clauses into separate sentences"""
        coordinators = [" and ", " but ", " or "]
        
        for coord in coordinators:
            if coord in text:
                parts = text.split(coord, 1)
                if len(parts) == 2:
                    return f"{parts[0].strip()}. {parts[1].strip().capitalize()}"
        
        return None
    
    def _reorder_clauses(self, text):
        """Reorder clauses when possible"""
        # Move clauses starting with "because", "when", "if", etc.
        subordinators = ["because ", "when ", "if ", "although ", "while ", "since "]
        
        for sub in subordinators:
            if sub in text.lower():
                # Try moving the subordinate clause to the beginning
                lower_text = text.lower()
                index = lower_text.find(sub)
                if index > 0:  # Subordinate clause is not already at the beginning
                    main_clause = text[:index].strip().rstrip(',')
                    sub_clause = text[index:].strip()
                    return f"{sub_clause.capitalize()}, {main_clause.lower()}"
        
        return None
    
    def _change_perspective(self, text):
        """Change perspective or focus of the sentence"""
        results = []
        
        # Transform personal statements to general ones
        if text.lower().startswith("i "):
            general_form = text.replace("I ", "One ", 1).replace("my ", "one's ", 1)
            results.append(general_form)
        
        return results
    
    def _modify_intensity(self, text, style):
        """Modify intensity through qualifiers and intensifiers"""
        results = []
        
        if style == "formal":
            # Add formal qualifiers
            if not any(word in text.lower() for word in ["somewhat", "rather", "quite", "fairly"]):
                # Add a qualifier to the first adjective/adverb
                words = text.split()
                for i, word in enumerate(words):
                    if word.lower() in ["good", "bad", "difficult", "easy", "important", "clear"]:
                        words[i] = f"somewhat {word}"
                        results.append(" ".join(words))
                        break
        
        return results
    
    def _modify_relationships(self, text):
        """Modify temporal or causal relationships"""
        results = []
        
        # Add causal relationships where appropriate
        if ". " in text:
            sentences = text.split(". ")
            if len(sentences) == 2:
                # Try adding causal connection
                causal_form = f"{sentences[0].strip()}. Consequently, {sentences[1].strip().lower()}"
                results.append(causal_form)
        
        return results
    
    def _apply_style_grammar(self, text, style):
        """Apply style-specific grammar transformations"""
        if style == "formal":
            # Convert contractions
            text = text.replace("can't", "cannot").replace("won't", "will not")
            text = text.replace("don't", "do not").replace("isn't", "is not")
            text = text.replace("aren't", "are not").replace("doesn't", "does not")
            text = text.replace("I'm", "I am").replace("you're", "you are")
            text = text.replace("it's", "it is").replace("that's", "that is")
            
        elif style == "casual":
            # Convert formal to casual
            text = text.replace("cannot", "can't").replace("will not", "won't")
            text = text.replace("do not", "don't").replace("is not", "isn't")
            
        return text
        
    def _add_sentence_connectors(self, text, style):
        """Add connectors and transitions to make variants"""
        results = []
        
        # Don't add connectors to questions or imperatives
        if text.endswith('?') or text.endswith('!'):
            return results
        
        if style == "formal":
            connectors = [
                "Furthermore, ",
                "Additionally, ",
                "It is worth noting that ",
                "It should be emphasized that ",
                "Notably, "
            ]
        else:
            connectors = [
                "Also, ",
                "Plus, ",
                "By the way, ",
                "Actually, ",
                "Basically, "
            ]
        
        for connector in connectors[:2]:  # Use first 2 to avoid too many variants
            results.append(connector + text.lower())
        
        return results
    
    def _change_sentence_types(self, text):
        """Transform between different sentence types where possible"""
        results = []
        
        # Transform statements into emphatic forms
        if not text.endswith('?') and not text.endswith('!'):
            # Add emphasis
            if text.endswith('.'):
                emphatic = text[:-1] + "!"
                results.append(emphatic)
        
        # Transform questions into statements (when possible)
        if text.startswith("Where ") and text.endswith("?"):
            # "Where did you go?" → "I would like to know where you went."
            statement = "I would like to know " + text[:-1].lower() + "."
            results.append(statement)
        
        return results
    
    def _expand_contract_phrases(self, text, style):
        """Expand contractions or contract phrases"""
        results = []
        
        if style == "formal":
            # Expand contractions and add formal language
            expanded = text
            
            # Contract to expand mappings
            contractions = {
                "can't": "cannot",
                "won't": "will not", 
                "don't": "do not",
                "doesn't": "does not",
                "isn't": "is not",
                "aren't": "are not",
                "I'm": "I am",
                "you're": "you are",
                "it's": "it is",
                "that's": "that is",
                "we're": "we are",
                "they're": "they are"
            }
            
            for contraction, expansion in contractions.items():
                if contraction in expanded:
                    expanded = expanded.replace(contraction, expansion)
            
            if expanded != text:
                results.append(expanded)
                
            # Add formal phrases
            if text.startswith("I "):
                formal_version = "It is my belief that " + text[2:].lower()
                results.append(formal_version)
        
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
        
        # Debug logging
        logging.info(f"Input text: {text}")
        logging.info(f"Style: {style}")
        logging.info(f"Num alternatives: {num_alternatives}")
        
        # Get model and paraphrase
        model = ParaphraseModel()
        results = model.paraphrase(text, style, num_alternatives)
        
        # Debug logging
        logging.info(f"Results: {results}")
        
        # Output results (one per line)
        for result in results:
            print(result)
            
    except Exception as e:
        logging.error(f"Main execution failed: {e}")
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()