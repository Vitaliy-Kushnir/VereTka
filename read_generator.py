with open('services/localGeneratorService.ts', 'r') as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if "switch" in line:
            print(f"L{i+1}: {line.strip()}")
        if "case" in line:
            print(f"L{i+1}: {line.strip()}")
        if "default" in line:
            print(f"L{i+1}: {line.strip()}")
