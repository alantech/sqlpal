You will need to spin up a VM with GPU support (minimum V100). Then you can deploy different models:

# Vicuna

```
git clone https://github.com/oobabooga/text-generation-webui.git
cd text-generation-webui/
conda create -n vicuna python=3.9
conda activate vicuna
pip install -r requirements.txt

mkdir repositories
cd repositories/
git clone https://github.com/oobabooga/GPTQ-for-LLaMa.git -b cuda

cd GPTQ-for-LLaMa/
python setup_cuda.py install
cd ..

python download-model.py anon8231489123/vicuna-13b-GPTQ-4bit-128g
python server.py --api --model anon8231489123_vicuna-13b-GPTQ-4bit-128g --model_type LLaMA --wbits 4 --groupsize 128
```

# Llama-7b

```
git clone https://github.com/oobabooga/text-generation-webui.git
cd text-generation-webui/
conda create -n vicuna python=3.9
conda activate vicuna
pip install -r requirements.txt

python download-model.py Neko-Institute-of-Science/LLaMA-7B-HF
python download-model.py oobabooga/llama-tokenizer
python server.py --api --model Neko-Institute-of-Science_LLaMA-7B-HF
```
