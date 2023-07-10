from setuptools import setup, find_packages

setup(
    name='sqlpal-server',
    version='0.1',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'Flask==2.2.3',
    ],
    entry_points={
        'console_scripts': [
            'myapp=myapp.cli:main'
        ]
    },
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Environment :: Web Environment',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: GNU Affero General Public License v3',
        'Programming Language :: Python :: 3',
        'Topic :: Internet :: WWW/HTTP :: WSGI :: Application',
    ],    
)