from setuptools import setup
setup(
    name="poke-cli",
    version="1.0.0",
    py_modules=["poke"],
    entry_points={"console_scripts": ["poke=poke:main"]},
    description="Poke Labs CLI toolkit - zero dependencies",
    license="MIT",
)
