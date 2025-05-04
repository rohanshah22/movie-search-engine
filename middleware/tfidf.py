import json
import math
import pandas as pd

from collections import Counter
from nltk.stem import PorterStemmer
ps = PorterStemmer()

vocab = None
inverted_index = None
dataset = None
idf_matrix = None
M = None
avdl = None

K = 3
b = 0.5

data = None

try:
    with open("inverted_index.json", "r") as f:
        data = json.load(f)
except FileNotFoundError:
    print("Error: The file 'inverted_index.json' was not found.")
    data = None
except json.JSONDecodeError:
    print("Error: Failed to decode JSON from the file.")
    data = None
except Exception as e:
    print(f"An unexpected error occurred: {e}")
    data = None

inverted_index = data["inverted_index"]
document_lengths = data["document_lengths"]
vocab = data["vocab"]
M = data["M"]
avdl = data["avdl"]
idf_matrix = None

def create_idf_matrix():

  t_idf_matrix = {}

  for vocab_word in inverted_index:
    k = len(inverted_index[vocab_word])
    t_idf_matrix[vocab_word] = math.log((M + 1) / k)

  return t_idf_matrix


def determine_query_vectors(queries):
    query_vectors = {} 

    for query in queries:
        words = query.split() 
        query_vectors[query] = Counter(words)

    return query_vectors
   
def execute_search(word_counts):
    
    accumulator = {}

    for base_word, query_count in word_counts.items():
            query_word = ps.stem(base_word)
            if query_word in inverted_index:
                
                documents = inverted_index[query_word]
                
                for doc_id, doc_count in documents.items():
                    ind = int(doc_id) - 1
                    # print(query_word, dataset[1][ind])
                    numerator = (K + 1) * doc_count
                    denominator = doc_count + (K * (1 - b + (b * (document_lengths[doc_id] / avdl))))

                    if query_word in idf_matrix:
 
                        score = query_count * (numerator / denominator) * idf_matrix[query_word]

                        accumulator[doc_id] = accumulator.get(doc_id, 0) + score

    return accumulator

def print_docs(query, relevence_docs):
    sorted_word_freqs = dict(sorted(relevence_docs.items(), key=lambda item: item[1], reverse=True))
    top_five = list(sorted_word_freqs.keys())[:5]

    print(f"<---------- Relevant Document Results for Query: {query} ---------->")
    print()
    c = 1
    for ind in top_five:
       i = int(ind) - 1
       score = sorted_word_freqs[ind]
       title = dataset[1][i]
       doc = dataset[2][i]
       print()
    #    print("Score: ", score, "Title:", title, "Document: ", doc)
       print(f"Score: {score}, Title: {title}")
       print()
       c += 1

    print ("<---------- End ---------->")
    print()
    print()

    # prints out the lowest five documents that have at least a query word in the document (Was asked in Campus Wire Post #224)

# def print_specific():
#     i = 105
#     title = dataset[1][i]
#     doc = dataset[2][i]
#     words = doc.split()
#     for word in words:
#       print(ps.stem(word))

if __name__ == '__main__':
   dataset = pd.read_csv("train.csv",header=None)

   idf_matrix = create_idf_matrix()

   queries = ["billionare named bruce wayne becomes batman superhero fights crime"]

   query_vectors = determine_query_vectors(queries)

   for query, word_counts in query_vectors.items():
        print("QUERY: ", query)
        relevence_docs = execute_search(word_counts)
        print_docs(query, relevence_docs)

