import json

with open('related_movies.json', 'r') as f:
  related_movies = json.load(f)

# Given a movie title, return its top-N related movies (title, score, index).
def get_related_movies(movie_title, top_n=5):
  print(f"Movies similar to '{movie_title}'")
  if movie_title not in related_movies:
    print(f"Movie '{movie_title}' not found.")
    return []

  results = related_movies[movie_title][:top_n]
  for movie in results:
    print(f"- {movie['title']} (Score: {movie['score']}, Index: {movie['index']})")
      
  return results

get_related_movies("Shrek")
