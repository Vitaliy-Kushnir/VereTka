with open('vite.config.ts', 'r') as f:
    content = f.read()

replacement = """  base: '/VereTka/',
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
})"""

content = content.replace("  base: '/VereTka/',\n})", replacement)

with open('vite.config.ts', 'w') as f:
    f.write(content)
print("SUCCESS")
