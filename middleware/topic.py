import os
import string
import pandas as pd
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from gensim import corpora
from gensim.models import LdaModel
from gensim.models import TfidfModel
import json

from gensim.corpora import MmCorpus
import pickle

from gensim.models import CoherenceModel

title_map = None
# Load the mapping
with open('smallSetToLargeSet', 'r') as f:
    title_map = json.load(f)

import numpy as np
import matplotlib.pyplot as plt
# import seaborn as sns

from tqdm import tqdm

TOKENIZED_PATH = "tokenized_docs.pkl"
CORPUS_PATH = "corpus.mm"

# Config
TRAIN_NEW_MODEL = False  # Set to True to retrain and overwrite model
MODEL_PATH = "lda_model.gensim"
DICT_PATH = "lda_dictionary.dict"
CSV_PATH = "train3.csv"

# Load data
large_df = pd.read_csv(CSV_PATH, header=None)
small_df = pd.read_csv('train.csv', header=None)

documents = large_df.iloc[:, 2].dropna().tolist()

def create_map_json():
    large_titles = large_df[1]
    small_titles = small_df[1]

    # Create dictionaries mapping title → index
    large_index_map = {title: idx for idx, title in large_titles.items()}
    small_index_map = {title: idx for idx, title in small_titles.items()}

    # Only keep titles present in both datasets
    shared_titles = set(large_index_map.keys()) & set(small_index_map.keys())
    print(len(shared_titles))

    # Create final mapping dictionary
    title_to_indices = {
        title: {
            "smallSet_index": small_index_map[title],
            "largeSet_index": large_index_map[title]
        }
        for title in shared_titles
    }

    with open("smallSetToLargeSet", 'w') as f:
        json.dump(title_to_indices, f, indent=2)
    

# Preprocessing
stop_words = set(stopwords.words('english'))

from nltk.stem import WordNetLemmatizer
lemmatizer = WordNetLemmatizer()

names = ['joe', 'jake', 'kelly', 'one', 'two', 'life', 'go', 'must', 'from', 'get', 'live', 'elvis', 'jason', 'sophie', 'oregon', 'sarah', 'mike', 'franciso', 'angeles', 'los', 'movie', 'film', 'eddie', 'bill', 'san', 'francisco']

def preprocess(doc):
    # doc = doc.lower().translate(str.maketrans('', '', string.punctuation))
    # tokens = word_tokenize(doc)
    # lemmatized_tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stop_words and word.isalpha() and word not in names]

    tokens = word_tokenize(doc)
    lemmatized_tokens = [
        lemmatizer.lemmatize(word) for word in tokens
        if word not in stop_words           # Remove stopwords
        and word.isalpha()                  # Remove non-alphabetic tokens
        and not word[0].isupper()           # Remove words that start with a capital letter
        and word.lower() not in names
    ]
    
    # Now, lowercase the tokens to ensure consistency for further processing
    lemmatized_tokens = [word.lower() for word in lemmatized_tokens]
    
    return lemmatized_tokens

# Load or create dictionary, corpus, and tokenized_docs
if os.path.exists(TOKENIZED_PATH) and os.path.exists(CORPUS_PATH) and os.path.exists(DICT_PATH) and not TRAIN_NEW_MODEL:
    print("Loading cached tokenized docs, dictionary, and corpus...")
    with open(TOKENIZED_PATH, 'rb') as f:
        tokenized_docs = pickle.load(f)

    dictionary = corpora.Dictionary.load(DICT_PATH)
    corpus = MmCorpus(CORPUS_PATH)

else:
    print("Preprocessing and training from scratch...")

    documents = large_df.iloc[:, 2].dropna().tolist()
    tokenized_docs = [preprocess(doc) for doc in tqdm(documents)]

    # Save tokenized_docs
    with open(TOKENIZED_PATH, 'wb') as f:
        pickle.dump(tokenized_docs, f)

    dictionary = corpora.Dictionary(tokenized_docs)
    dictionary.filter_extremes(no_below=5, no_above=0.5)
    dictionary.save(DICT_PATH)

    corpus = [dictionary.doc2bow(doc) for doc in tokenized_docs]
    MmCorpus.serialize(CORPUS_PATH, corpus)


# Load or train
if TRAIN_NEW_MODEL or not (os.path.exists(MODEL_PATH) and os.path.exists(DICT_PATH)):
    print("Training new LDA model...")
    dictionary = corpora.Dictionary(tokenized_docs)
    dictionary.filter_extremes(no_below=5, no_above=0.5)
    corpus = [dictionary.doc2bow(doc) for doc in tokenized_docs]

    # tfidf_model = TfidfModel(corpus)
    # tfidf_corpus = tfidf_model[corpus]
    print("line 64")
    lda_model = LdaModel(
        corpus=corpus,
        id2word=dictionary,
        num_topics=10,
        passes=10,
        iterations=50,
        alpha=.01,
        eta='auto',
        random_state=42,
        # callbacks=[MyProgressCallback(tfidf_corpus)]
    )
    # ldamallet = LdaMallet(mallet_path, corpus=corpus, num_topics=15, id2word=dictionary)

    lda_model.save(MODEL_PATH)
    dictionary.save(DICT_PATH)
    print("Model trained and saved.")
else:
    print("Loading saved LDA model...")
    dictionary = corpora.Dictionary.load(DICT_PATH)
    corpus = [dictionary.doc2bow(doc) for doc in tokenized_docs]
    lda_model = LdaModel.load(MODEL_PATH)
    print("Model loaded.")

def get_topic_distribution(doc_tokens):
    bow = dictionary.doc2bow(doc_tokens)
    # minimum_probability=0.0 ensures you get all topics (not just the top few)
    return lda_model.get_document_topics(bow, minimum_probability=0.0)

def getTopicsForDocument(doc_title):
    smallIndex = title_map[doc_title]["smallSet_index"]
    largeIndex = title_map[doc_title]["largeSet_index"]
    distribution = get_topic_distribution(tokenized_docs[largeIndex])

    topic = 0
    topic_prob = 0

    for topic_id, prob in distribution:
        if prob > topic_prob:
            topic = topic_id
            topic_prob = prob
        # print(f"Topic {topic_id}: {prob:.4f}")
    
    print()
    print(f"Title: {doc_title} Topic: {topic}: {topic_prob:.4f}")
    #    print("Score: ", score, "Title:", title, "Document: ", doc)
    print()

def searchByTopic(topic_id, top_n=5, threshold=0.3):
    """
    Prints the top_n documents where the given topic_id is most prominent.
    Only includes documents where topic probability > threshold.
    """
    matches = []

    for idx, doc_tokens in enumerate(tokenized_docs):
        distribution = get_topic_distribution(doc_tokens)
        for tid, prob in distribution:
            if tid == topic_id and prob >= threshold:
                matches.append((idx, prob))
                break

    # Sort by probability descending
    matches.sort(key=lambda x: x[1], reverse=True)

    print(f"\nTop words for Topic {topic_id}:")
    for word, prob in lda_model.show_topic(topic_id, topn=5):
        print(f"{word}: {prob:.4f}")

    print(f"\nTop {top_n} documents for Topic {topic_id} (threshold={threshold}):\n")
    for i, (doc_idx, prob) in enumerate(matches[:top_n]):
        title = df.iloc[doc_idx, 1]
        print(f"{i+1}. Title: {title}\n   Probability: {prob:.4f}\n")

    # Optional: also print top words in the topic

# create_map_json()


# getTopicsForDocument(16983)
for i in range(10):
    print(f"Topic {i} ")
    print(lda_model.show_topic(i, topn=5))
    print("<--------------------->")

getTopicsForDocument("Batman")