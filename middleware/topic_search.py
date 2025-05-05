import json

with open("lda_topic_scores.json", "r") as f:
    topic_data = json.load(f)

def get_top_movies_by_topic(topic_num, top_n=5):
    sorted_movies = sorted(topic_data, key=lambda x: x["topic_scores"][str(topic_num)], reverse=True)
    
    for movie in sorted_movies[:top_n]:
      print(movie['title'])
    
    # print(sorted_movies[:top_n])
    return sorted_movies[:top_n]
  
get_top_movies_by_topic(5)
