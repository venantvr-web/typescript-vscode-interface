#!/bin/bash

# Instruction 1: Initialiser le dépôt Git
wscat -c ws://localhost:3000 -x '{"requestId":"7001","command":"execute-command","shellCommand":"git init && echo \"# Python.VsCode.Interface\" > README.md && git add README.md && git commit -m \"Initial commit\" && git remote add origin https://github.com/venantvr/Python.VsCode.Interface.git && git branch -M main"}'
# sleep 1

# Instruction 2: Créer un environnement virtuel
wscat -c ws://localhost:3000 -x '{"requestId":"7002","command":"execute-command","shellCommand":"python3 -m venv venv"}'
# sleep 1

# Instruction 3: Installer pytest
wscat -c ws://localhost:3000 -x '{"requestId":"7003","command":"execute-command","shellCommand":"bash -c \". venv/bin/activate && pip install pytest\""}'
# sleep 1

# Instruction 4: Créer un module Python (math_utils.py avec classes)
wscat -c ws://localhost:3000 -x '{"requestId":"7004","command":"create-file","filePath":"src/math_utils.py","content":"def add(a, b):\n    return a + b\n\nclass Calculator:\n    def multiply(self, a, b):\n        return a * b\n\nclass Counter:\n    def increment(self, value):\n        return value + 1\n\nclass Divider:\n    def divide(self, a, b):\n        return a / b if b != 0 else None\n\nclass Subtractor:\n    def subtract(self, a, b):\n        return a - b\n\nclass Power:\n    def power(self, base, exp):\n        return base ** exp\n\nclass Modulo:\n    def modulo(self, a, b):\n        return a % b if b != 0 else None\n\nclass Square:\n    def square(self, x):\n        return x * x\n\nclass Cube:\n    def cube(self, x):\n        return x ** 3\n\nclass MaxFinder:\n    def maximum(self, a, b):\n        return max(a, b)\n\nclass MinFinder:\n    def minimum(self, a, b):\n        return min(a, b)\n\nclass Average:\n    def average(self, numbers):\n        return sum(numbers) / len(numbers) if numbers else 0\n\nclass Factorial:\n    def factorial(self, n):\n        return 1 if n <= 1 else n * self.factorial(n - 1)\n\nclass Absolute:\n    def absolute(self, x):\n        return abs(x)\n\nclass Rounder:\n    def round_number(self, x):\n        return round(x)\n\nclass Floor:\n    def floor(self, x):\n        return int(x // 1)\n\nclass Ceiling:\n    def ceiling(self, x):\n        return int(x // 1 + 1) if x % 1 else int(x)\n\nclass IsEven:\n    def is_even(self, x):\n        return x % 2 == 0\n\nclass IsOdd:\n    def is_odd(self, x):\n        return x % 2 != 0\n\nclass SumList:\n    def sum_list(self, numbers):\n        return sum(numbers)\n\nclass Length:\n    def length(self, items):\n        return len(items)\n"}'
# sleep 1

# Instruction 5: Créer le test pour add
wscat -c ws://localhost:3000 -x '{"requestId":"7005","command":"create-file","filePath":"tests/test_math.py","content":"import unittest\nfrom src.math_utils import add\n\nclass TestMath(unittest.TestCase):\n    def test_add(self):\n        self.assertEqual(add(2, 3), 5)\n"}'
# sleep 1

# Instruction 6: Créer le test pour Calculator
wscat -c ws://localhost:3000 -x '{"requestId":"7006","command":"create-file","filePath":"tests/test_calculator.py","content":"import unittest\nfrom src.math_utils import Calculator\n\nclass TestCalculator(unittest.TestCase):\n    def test_multiply(self):\n        calc = Calculator()\n        self.assertEqual(calc.multiply(2, 3), 6)\n"}'
# sleep 1

# Instruction 7: Créer le test pour Counter
wscat -c ws://localhost:3000 -x '{"requestId":"7007","command":"create-file","filePath":"tests/test_counter.py","content":"import unittest\nfrom src.math_utils import Counter\n\nclass TestCounter(unittest.TestCase):\n    def test_increment(self):\n        counter = Counter()\n        self.assertEqual(counter.increment(5), 6)\n"}'
# sleep 1

# Instruction 8: Créer le test pour Divider
wscat -c ws://localhost:3000 -x '{"requestId":"7008","command":"create-file","filePath":"tests/test_divider.py","content":"import unittest\nfrom src.math_utils import Divider\n\nclass TestDivider(unittest.TestCase):\n    def test_divide(self):\n        divider = Divider()\n        self.assertEqual(divider.divide(10, 2), 5.0)\n        self.assertIsNone(divider.divide(10, 0))\n"}'
# sleep 1

# Instruction 9: Créer le test pour Subtractor
wscat -c ws://localhost:3000 -x '{"requestId":"7009","command":"create-file","filePath":"tests/test_subtractor.py","content":"import unittest\nfrom src.math_utils import Subtractor\n\nclass TestSubtractor(unittest.TestCase):\n    def test_subtract(self):\n        subtractor = Subtractor()\n        self.assertEqual(subtractor.subtract(5, 3), 2)\n"}'
# sleep 1

# Instruction 10: Créer le test pour Power
wscat -c ws://localhost:3000 -x '{"requestId":"7010","command":"create-file","filePath":"tests/test_power.py","content":"import unittest\nfrom src.math_utils import Power\n\nclass TestPower(unittest.TestCase):\n    def test_power(self):\n        power = Power()\n        self.assertEqual(power.power(2, 3), 8)\n"}'
# sleep 1

# Instruction 11: Créer le test pour Modulo
wscat -c ws://localhost:3000 -x '{"requestId":"7011","command":"create-file","filePath":"tests/test_modulo.py","content":"import unittest\nfrom src.math_utils import Modulo\n\nclass TestModulo(unittest.TestCase):\n    def test_modulo(self):\n        modulo = Modulo()\n        self.assertEqual(modulo.modulo(10, 3), 1)\n        self.assertIsNone(modulo.modulo(10, 0))\n"}'
# sleep 1

# Instruction 12: Créer le test pour Square
wscat -c ws://localhost:3000 -x '{"requestId":"7012","command":"create-file","filePath":"tests/test_square.py","content":"import unittest\nfrom src.math_utils import Square\n\nclass TestSquare(unittest.TestCase):\n    def test_square(self):\n        square = Square()\n        self.assertEqual(square.square(4), 16)\n"}'
# sleep 1

# Instruction 13: Créer le test pour Cube
wscat -c ws://localhost:3000 -x '{"requestId":"7013","command":"create-file","filePath":"tests/test_cube.py","content":"import unittest\nfrom src.math_utils import Cube\n\nclass TestCube(unittest.TestCase):\n    def test_cube(self):\n        cube = Cube()\n        self.assertEqual(cube.cube(3), 27)\n"}'
# sleep 1

# Instruction 14: Créer le test pour MaxFinder
wscat -c ws://localhost:3000 -x '{"requestId":"7014","command":"create-file","filePath":"tests/test_max_finder.py","content":"import unittest\nfrom src.math_utils import MaxFinder\n\nclass TestMaxFinder(unittest.TestCase):\n    def test_maximum(self):\n        max_finder = MaxFinder()\n        self.assertEqual(max_finder.maximum(5, 3), 5)\n"}'
# sleep 1

# Instruction 15: Créer le test pour MinFinder
wscat -c ws://localhost:3000 -x '{"requestId":"7015","command":"create-file","filePath":"tests/test_min_finder.py","content":"import unittest\nfrom src.math_utils import MinFinder\n\nclass TestMinFinder(unittest.TestCase):\n    def test_minimum(self):\n        min_finder = MinFinder()\n        self.assertEqual(min_finder.minimum(5, 3), 3)\n"}'
# sleep 1

# Instruction 16: Créer le test pour Average
wscat -c ws://localhost:3000 -x '{"requestId":"7016","command":"create-file","filePath":"tests/test_average.py","content":"import unittest\nfrom src.math_utils import Average\n\nclass TestAverage(unittest.TestCase):\n    def test_average(self):\n        avg = Average()\n        self.assertEqual(avg.average([1, 2, 3]), 2.0)\n        self.assertEqual(avg.average([]), 0)\n"}'
# sleep 1

# Instruction 17: Créer le test pour Factorial
wscat -c ws://localhost:3000 -x '{"requestId":"7017","command":"create-file","filePath":"tests/test_factorial.py","content":"import unittest\nfrom src.math_utils import Factorial\n\nclass TestFactorial(unittest.TestCase):\n    def test_factorial(self):\n        fact = Factorial()\n        self.assertEqual(fact.factorial(5), 120)\n        self.assertEqual(fact.factorial(0), 1)\n"}'
# sleep 1

# Instruction 18: Créer le test pour Absolute
wscat -c ws://localhost:3000 -x '{"requestId":"7018","command":"create-file","filePath":"tests/test_absolute.py","content":"import unittest\nfrom src.math_utils import Absolute\n\nclass TestAbsolute(unittest.TestCase):\n    def test_absolute(self):\n        abs_val = Absolute()\n        self.assertEqual(abs_val.absolute(-5), 5)\n"}'
# sleep 1

# Instruction 19: Créer le test pour Rounder
wscat -c ws://localhost:3000 -x '{"requestId":"7019","command":"create-file","filePath":"tests/test_rounder.py","content":"import unittest\nfrom src.math_utils import Rounder\n\nclass TestRounder(unittest.TestCase):\n    def test_round_number(self):\n        rounder = Rounder()\n        self.assertEqual(rounder.round_number(3.6), 4)\n"}'
# sleep 1

# Instruction 20: Créer le test pour Floor
wscat -c ws://localhost:3000 -x '{"requestId":"7020","command":"create-file","filePath":"tests/test_floor.py","content":"import unittest\nfrom src.math_utils import Floor\n\nclass TestFloor(unittest.TestCase):\n    def test_floor(self):\n        floor = Floor()\n        self.assertEqual(floor.floor(3.7), 3)\n"}'
# sleep 1

# Instruction 21: Créer le test pour Ceiling
wscat -c ws://localhost:3000 -x '{"requestId":"7021","command":"create-file","filePath":"tests/test_ceiling.py","content":"import unittest\nfrom src.math_utils import Ceiling\n\nclass TestCeiling(unittest.TestCase):\n    def test_ceiling(self):\n        ceiling = Ceiling()\n        self.assertEqual(ceiling.ceiling(3.2), 4)\n        self.assertEqual(ceiling.ceiling(3.0), 3)\n"}'
# sleep 1

# Instruction 22: Créer le test pour IsEven
wscat -c ws://localhost:3000 -x '{"requestId":"7022","command":"create-file","filePath":"tests/test_is_even.py","content":"import unittest\nfrom src.math_utils import IsEven\n\nclass TestIsEven(unittest.TestCase):\n    def test_is_even(self):\n        is_even = IsEven()\n        self.assertTrue(is_even.is_even(4))\n        self.assertFalse(is_even.is_even(3))\n"}'
# sleep 1

# Instruction 23: Créer le test pour IsOdd
wscat -c ws://localhost:3000 -x '{"requestId":"7023","command":"create-file","filePath":"tests/test_is_odd.py","content":"import unittest\nfrom src.math_utils import IsOdd\n\nclass TestIsOdd(unittest.TestCase):\n    def test_is_odd(self):\n        is_odd = IsOdd()\n        self.assertTrue(is_odd.is_odd(3))\n        self.assertFalse(is_odd.is_odd(4))\n"}'
# sleep 1

# Instruction 24: Créer le test pour SumList
wscat -c ws://localhost:3000 -x '{"requestId":"7024","command":"create-file","filePath":"tests/test_sum_list.py","content":"import unittest\nfrom src.math_utils import SumList\n\nclass TestSumList(unittest.TestCase):\n    def test_sum_list(self):\n        sum_list = SumList()\n        self.assertEqual(sum_list.sum_list([1, 2, 3]), 6)\n"}'
# sleep 1

# Instruction 25: Créer le test pour Length
wscat -c ws://localhost:3000 -x '{"requestId":"7025","command":"create-file","filePath":"tests/test_length.py","content":"import unittest\nfrom src.math_utils import Length\n\nclass TestLength(unittest.TestCase):\n    def test_length(self):\n        length = Length()\n        self.assertEqual(length.length([1, 2, 3]), 3)\n"}'
# sleep 1

# Instruction 26: Exécuter les tests en utilisant outputFile
wscat -c ws://localhost:3000 -x '{"requestId":"7026","command":"execute-command","shellCommand":"bash -c \". venv/bin/activate && python3 -m unittest discover tests\"","outputFile":"test_results.json"}'
# sleep 1

# Instruction 27: Committer les modifications
wscat -c ws://localhost:3000 -x '{"requestId":"7027","command":"execute-command","shellCommand":"git add . && git commit -m \"Add 20 classes and tests\""}'
# sleep 1

# Instruction 28: Pousser les modifications
wscat -c ws://localhost:3000 -x '{"requestId":"7028","command":"execute-command","shellCommand":"bash -c \"git push origin main\""}'