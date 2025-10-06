#!/usr/bin/env python3
"""
Advanced test suite for the universal paraphraser - 30 additional tests
Tests more complex scenarios, edge cases, and domain-specific language
"""

import sys
import os
import subprocess
import json
from typing import List, Tuple

# Add the scripts directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'scripts'))

def run_paraphraser(text: str, style: str = "formal", num_alternatives: int = 3) -> List[str]:
    """Run the paraphraser script and return results"""
    try:
        # Use the virtual environment Python
        venv_python = "/Users/robertcumahig/Documents/PROJECTS/paraphraser-api/.venv/bin/python"
        script_path = "/Users/robertcumahig/Documents/PROJECTS/paraphraser-api/scripts/paraphrase_model.py"
        
        result = subprocess.run(
            [venv_python, script_path, text, style, str(num_alternatives)],
            capture_output=True,
            text=True,
            cwd="/Users/robertcumahig/Documents/PROJECTS/paraphraser-api"
        )
        
        if result.returncode != 0:
            print(f"Error running paraphraser: {result.stderr}")
            return []
        
        # Parse the output - the paraphrases are the last lines
        lines = result.stdout.strip().split('\n')
        paraphrases = []
        
        # Skip log lines and get actual paraphrases
        for line in lines:
            if not line.startswith('INFO:') and line.strip() and line != text:
                paraphrases.append(line.strip())
        
        return paraphrases
    except Exception as e:
        print(f"Exception running paraphraser: {e}")
        return []

def test_paraphrase_quality(original: str, paraphrases: List[str]) -> Tuple[bool, str]:
    """Test if paraphrases are of good quality"""
    if not paraphrases:
        return False, "No paraphrases generated"
    
    # Check if paraphrases are different from original
    different_count = 0
    for para in paraphrases:
        if para.strip() != original.strip():
            different_count += 1
    
    if different_count == 0:
        return False, "All paraphrases are identical to original"
    
    # Check if paraphrases are different from each other
    unique_paraphrases = set([p.strip() for p in paraphrases])
    if len(unique_paraphrases) < 2:
        return False, "Paraphrases are too similar to each other"
    
    # Check for reasonable length (not truncated)
    for para in paraphrases:
        if len(para.split()) < len(original.split()) * 0.4:  # More lenient for advanced tests
            return False, f"Paraphrase too short: '{para}'"
    
    return True, "Quality check passed"

def run_test(test_num: int, description: str, text: str, style: str = "formal") -> bool:
    """Run a single test case"""
    print(f"\nTest {test_num}: {description}")
    print(f"Input: {text}")
    print(f"Style: {style}")
    
    paraphrases = run_paraphraser(text, style, 3)
    
    if not paraphrases:
        print("❌ FAILED: No paraphrases generated")
        return False
    
    quality_passed, quality_msg = test_paraphrase_quality(text, paraphrases)
    
    if quality_passed:
        print("✅ PASSED")
        for i, para in enumerate(paraphrases[:3], 1):
            print(f"  {i}. {para}")
        return True
    else:
        print(f"❌ FAILED: {quality_msg}")
        if paraphrases:
            for i, para in enumerate(paraphrases[:3], 1):
                print(f"  {i}. {para}")
        return False

def main():
    """Run advanced test suite"""
    print("🧪 ADVANCED UNIVERSAL PARAPHRASER TEST SUITE")
    print("=" * 60)
    
    advanced_test_cases = [
        # 31-35: Scientific and academic language
        (31, "Scientific hypothesis", "The researchers hypothesized that increased temperature would accelerate the reaction rate.", "formal"),
        (32, "Academic conclusion", "The study concludes that there is a significant correlation between exercise and mental health.", "formal"),
        (33, "Research methodology", "Data was collected through structured interviews and analyzed using statistical software.", "formal"),
        (34, "Scientific observation", "The experiment revealed unexpected patterns in cellular behavior under stress conditions.", "formal"),
        (35, "Academic argument", "Previous literature suggests that this approach may not be universally applicable.", "formal"),
        
        # 36-40: Legal and formal documentation
        (36, "Legal statement", "The defendant hereby agrees to comply with all terms and conditions outlined in this agreement.", "formal"),
        (37, "Policy declaration", "All employees must adhere to the company's data protection guidelines at all times.", "formal"),
        (38, "Contractual obligation", "The service provider shall deliver the completed project within the specified timeframe.", "formal"),
        (39, "Regulatory requirement", "Organizations are required to implement appropriate security measures to protect user data.", "formal"),
        (40, "Compliance notice", "Failure to meet these standards may result in penalties or legal action.", "formal"),
        
        # 41-45: Creative and literary language
        (41, "Descriptive narrative", "The ancient oak tree stood majestically in the center of the village square.", "casual"),
        (42, "Emotional expression", "Her heart raced with excitement as she opened the long-awaited letter.", "casual"),
        (43, "Metaphorical language", "Time seemed to crawl like a wounded animal through the endless afternoon.", "casual"),
        (44, "Sensory description", "The aroma of freshly baked bread filled the warm kitchen with comfort.", "casual"),
        (45, "Character description", "He was a man of few words but profound actions that spoke volumes.", "formal"),
        
        # 46-50: Technical and programming contexts
        (46, "Code documentation", "This function validates user input and returns an error message if validation fails.", "formal"),
        (47, "System architecture", "The microservices communicate through RESTful APIs and message queues.", "formal"),
        (48, "Database operations", "The query retrieves all records where the timestamp falls within the specified range.", "formal"),
        (49, "Security protocols", "Authentication tokens expire after 24 hours and must be refreshed for continued access.", "formal"),
        (50, "Performance optimization", "Caching strategies significantly reduce database load and improve response times.", "formal"),
        
        # 51-55: Medical and healthcare language
        (51, "Medical diagnosis", "The patient presents with symptoms consistent with acute respiratory infection.", "formal"),
        (52, "Treatment recommendation", "Physical therapy combined with medication should alleviate the chronic pain.", "formal"),
        (53, "Health advice", "Regular exercise and a balanced diet contribute to overall cardiovascular health.", "casual"),
        (54, "Medical procedure", "The surgical intervention was successful and recovery is progressing normally.", "formal"),
        (55, "Health prevention", "Annual screenings help detect potential health issues before they become serious.", "formal"),
        
        # 56-60: Complex grammatical structures and edge cases
        (56, "Nested clauses", "The book that I bought yesterday, which was recommended by my professor, turned out to be fascinating.", "formal"),
        (57, "Multiple negations", "It's not uncommon for people to not realize that they're not being completely honest.", "casual"),
        (58, "Subjunctive mood", "If I were to choose again, I would probably make the same decision.", "formal"),
        (59, "Gerund phrases", "Swimming in the ocean while watching the sunset was an unforgettable experience.", "casual"),
        (60, "Elliptical constructions", "Some prefer coffee; others, tea; and still others, neither.", "formal"),
        
    ]
    
    passed_tests = 0
    total_tests = len(advanced_test_cases)
    
    for test_num, description, text, style in advanced_test_cases:
        if run_test(test_num, description, text, style):
            passed_tests += 1
    
    print("\n" + "=" * 60)
    print(f"📊 ADVANCED TEST RESULTS: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests >= 25:
        print("🎉 SUCCESS: At least 25 advanced tests passed!")
        return True
    else:
        print(f"❌ FAILURE: Only {passed_tests} tests passed, need at least 25")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)