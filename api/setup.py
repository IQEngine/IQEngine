# The only reason this file is here is to tell dependabot to not bump deps past what is supported by python 3.8.10

from distutils.core import setup

setup(
    name="foo",
    version="1.0",
    packages=[],
    python_requires='>=3.8.10',
)
