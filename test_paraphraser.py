#!/usr/bin/env python3
"""
Comprehensive test suite for the universal paraphraser
Tests 25+ different scenarios to ensure it works with any sentence type
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
        if len(para.split()) < len(original.split()) * 0.5:
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
    """Run comprehensive test suite"""
    print("🧪 UNIVERSAL PARAPHRASER TEST SUITE")
    print("=" * 50)
    
    test_cases = [
        # 1-5: Basic sentence structures
        (1, "Simple declarative sentence", "The cat sits on the mat.", "formal"),
        (2, "Compound sentence with 'and'", "I like coffee and I drink it daily.", "casual"),
        (3, "Complex sentence with subordinate clause", "When it rains, I stay inside.", "formal"),
        (4, "Question sentence", "Where did you go yesterday?", "casual"),
        (5, "Imperative sentence", "Please close the door quietly.", "formal"),
        
        # 6-10: Temporal expressions
        (6, "Past habitual action", "When I was young, I used to play soccer every day.", "casual"),
        (7, "Frequency expressions", "I always eat breakfast before work.", "formal"),
        (8, "Time-based routine", "Every morning, I check my emails first.", "casual"),
        (9, "Temporal sequence", "After I finish work, I usually go to the gym.", "formal"),
        (10, "Duration expression", "I have been working here for five years.", "casual"),
        
        # 11-15: Professional/Business contexts
        (11, "Business analysis", "The team analyzed the quarterly data and found significant trends.", "formal"),
        (12, "Project management", "We need to complete this project before the deadline.", "formal"),
        (13, "Technical description", "The software processes user input and generates appropriate responses.", "formal"),
        (14, "Meeting context", "During the meeting, we discussed several important issues.", "formal"),
        (15, "Performance review", "The employee consistently delivers high-quality work on time.", "formal"),
        
        # 16-20: Personal/Emotional contexts
        (16, "Stress expression", "I'm feeling overwhelmed with all these responsibilities.", "casual"),
        (17, "Happiness expression", "I'm so excited about my upcoming vacation.", "casual"),
        (18, "Uncertainty expression", "I'm not sure what to do about this situation.", "formal"),
        (19, "Goal statement", "I want to improve my skills and advance my career.", "formal"),
        (20, "Preference statement", "I prefer working in quiet environments.", "casual"),
        
        # 21-25: Complex grammatical structures
        (21, "Conditional sentence", "If it rains tomorrow, we will cancel the picnic.", "formal"),
        (22, "Passive voice", "The report was completed by the research team.", "formal"),
        (23, "Comparative structure", "This method is more efficient than the previous one.", "formal"),
        (24, "Cause and effect", "Because of the heavy traffic, I arrived late to work.", "casual"),
        (25, "Multiple clauses", "Although the weather was bad, we decided to go hiking because we needed exercise.", "casual"),
        
        # 26-30: Edge cases and special scenarios
        (26, "Contractions in formal style", "I can't believe it's already Friday!", "formal"),
        (27, "Slang in casual style", "That movie was really awesome and super fun.", "casual"),
        (28, "Long sentence", "The comprehensive research study that was conducted over several months revealed important insights about consumer behavior patterns.", "formal"),
        (29, "Short sentence", "I agree.", "casual"),
        (30, "Technical jargon", "The API endpoint returns JSON data with authentication tokens.", "formal"),
    ]
    
    passed_tests = 0
    total_tests = len(test_cases)
    
    for test_num, description, text, style in test_cases:
        if run_test(test_num, description, text, style):
            passed_tests += 1
    
    print("\n" + "=" * 50)
    print(f"📊 TEST RESULTS: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests >= 25:
        print("🎉 SUCCESS: At least 25 tests passed!")
        return True
    else:
        print(f"❌ FAILURE: Only {passed_tests} tests passed, need at least 25")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)