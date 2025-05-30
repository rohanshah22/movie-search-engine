import json
import math
from collections import Counter
from typing import List
import nltk
nltk.download("punkt")
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from nltk.stem import PorterStemmer
from fastapi.middleware.cors import CORSMiddleware

# ----- CONFIGURATION & GLOBALS -----
INVERTED_INDEX_PATH = "inverted_index.json"
DATASET_PATH        = "filtered_output.csv"
K = 3.0
b = 0.5



app = FastAPI(
    title="Movie Description Search",
    description="A simple BM25-style search over movie descriptions",
    version="1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ps = PorterStemmer()

# Will be filled on startup
inverted_index: dict       = {}
document_lengths: dict     = {}
vocab: List[str]           = []
M: int                     = 0
avdl: float                = 0.0
idf_matrix: dict           = {}
dataset: pd.DataFrame      = None


# ----- Pydantic MODELS -----
class SearchRequest(BaseModel):
    query: str

class SearchResult(BaseModel):
    doc_id: int
    title: str
    score: float
    description: str
    release_date: str
    run_time: int
    cast: str
    director: str


# ----- UTILITY FUNCTIONS -----
def create_idf_matrix():
    """
    Computes IDF scores for every term in the inverted index.
    idf(t) = log( (M + 1) / df(t) )
    """
    t_idf = {}
    for term, postings in inverted_index.items():
        df = len(postings)
        t_idf[term] = math.log((M + 1.0) / df)
    return t_idf

def determine_query_vector(query: str) -> Counter:
    """
    Tokenize & count raw query terms (no stemming yet).
    """
    tokens = query.strip().split()
    return Counter(tokens)

def execute_search(word_counts: Counter) -> dict:
    """
    Given a Counter of raw query words, stem them, and compute BM25
    scores across the entire corpus. Returns a dict of {doc_id: score}.
    """
    accumulator = {}
    for raw_word, q_count in word_counts.items():
        term = ps.stem(raw_word)
        if term not in inverted_index:
            continue

        postings = inverted_index[term]
        idf = idf_matrix.get(term, 0.0)

        for doc_id_str, f_td in postings.items():
            # convert to int index
            dl = document_lengths[doc_id_str]
            numerator = (K + 1.0) * f_td
            denominator = f_td + K * (1.0 - b + b * (dl / avdl))
            score = q_count * (numerator / denominator) * idf

            accumulator[doc_id_str] = accumulator.get(doc_id_str, 0.0) + score

    return accumulator

# def pair_names_from_string(name_string: str) -> List[str]:
#     names = name_string.split()
#     paired_names = []
#     for i in range(0, len(names), 2):
#         if i + 1 < len(names):
#             first_name = names[i]
#             last_name = names[i+1]
#             paired_names.append(f"{first_name} {last_name}")
#     return paired_names

def format_name_list(name_string: str) -> str:
  parts = [part for part in name_string.strip().split(' ') if part]

  if not parts:
    return ""

  full_names = []
  for i in range(0, len(parts) - len(parts) % 2, 2):
      full_name = f"{parts[i]} {parts[i+1]}"
      full_names.append(full_name)

  return ", ".join(full_names)

def get_top_n(accumulator: dict, n: int = 5) -> List[SearchResult]:
    """
    Sorts doc scores and returns top-n as SearchResult objects.
    class SearchResult(BaseModel):
    doc_id: int
    title: str
    score: float
    description: str
    release_date: str
    run_time: int
    cast: List[str]
    director: List[str]
    """
    # sort by score desc
    ranked = sorted(accumulator.items(), key=lambda kv: kv[1], reverse=True)[:n]
    results = []
    for doc_id_str, score in ranked:
        doc_idx = int(doc_id_str) - 1  # 0‐based index into the CSV
        title = dataset.iloc[doc_idx, 1]
        description = dataset.iloc[doc_idx, 2]
        release_date = dataset.iloc[doc_idx, 3]
        run_time = dataset.iloc[doc_idx, 4]
        cast = dataset.iloc[doc_idx, 5]
        directors = dataset.iloc[doc_idx, 6]
        results.append(SearchResult(
            doc_id=int(doc_id_str),
            title=title,
            score=score,
            description=description,
            release_date=release_date,
            run_time=run_time,
            cast=format_name_list(cast),
            director=directors,
        ))
    return results


# ----- FASTAPI EVENTS & ENDPOINTS -----
@app.on_event("startup")
def load_data():
    global inverted_index, document_lengths, vocab, M, avdl, idf_matrix, dataset

    # 1) Load inverted index JSON
    try:
        with open(INVERTED_INDEX_PATH, "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        raise RuntimeError(f"Could not find {INVERTED_INDEX_PATH}")
    except json.JSONDecodeError:
        raise RuntimeError(f"Invalid JSON in {INVERTED_INDEX_PATH}")

    inverted_index    = data["inverted_index"]
    document_lengths  = data["document_lengths"]
    vocab             = data["vocab"]
    M                 = data["M"]
    avdl              = data["avdl"]

    # 2) Build IDF matrix
    idf_matrix = create_idf_matrix()

    # 3) Load dataset
    #    train.csv assumed to have: [doc_id, title, description], no header
    dataset = pd.read_csv(DATASET_PATH, header=None, names=["doc_id", "title", "description", "release_date", "runtime", "cast", "director"])
    if dataset.empty:
        raise RuntimeError(f"{DATASET_PATH} is empty or invalid")


@app.post("/search", response_model=List[SearchResult])
def search(req: SearchRequest):
    """
    Accepts a JSON body {"query": "..."} and returns top 5 matching movies.
    """
    query = req.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query string cannot be empty")

    # 1) build query vector
    qvec = determine_query_vector(query)

    # 2) score all docs
    accumulator = execute_search(qvec)

    # 3) pick top 5
    results = get_top_n(accumulator, n=10)
    return results