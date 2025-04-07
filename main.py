from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, PlainTextResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import requests
import pandas as pd
from datetime import datetime, UTC
import urllib3
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

client_id = "jnFC40RylRkrfIRGI9adeA"  # Replace with your actual client ID if needed for more complex auth
client_secret = "ar8ge4EimhhPyNdVUDdbAMKdteNmdQ" # Replace with your actual client secret if needed for more complex auth
user_agent = "Imaginary-Cow1225"
headers = {'User-Agent': user_agent}


def scrape_reddit_comments(submission_url: str) -> pd.DataFrame:
    """
    Scrapes comments from a single Reddit submission URL and returns a Pandas DataFrame.
    """
    submission_id = submission_url.split('/')[-3]
    response = requests.get(submission_url + ".json", verify=False, headers=headers)

    if response.status_code != 200:
        print(f"Failed to retrieve data for URL: {submission_url} - Status Code: {response.status_code}")
        return pd.DataFrame()  # Return empty DataFrame in case of failure

    data = response.json()
    comments_data = []

    try:
        comments_listing = data[1]
        comments = comments_listing['data']['children']

        def extract_comments(comment_list, parent_id):
            extracted_comments = []
            for comment_data in comment_list:
                if comment_data['kind'] == 't1':
                    comment = comment_data['data']
                    comment_id = comment.get('id', 'unknown')
                    comment_author = comment.get('author', '[deleted]')
                    comment_body = comment.get('body', '[deleted]')
                    comment_score = comment.get('score', 0)
                    comment_depth = comment.get('depth', 0)
                    timestamp = comment.get('created_utc', 0)

                    dt_object = datetime.fromtimestamp(timestamp, UTC)
                    comment_date = dt_object.strftime('%Y-%m-%d')
                    comment_time = dt_object.strftime('%H:%M:%S')

                    extracted_comments.append([submission_id, comment_body, comment_id, comment_time, comment_date, comment_score, comment_depth, comment_author, parent_id, submission_url]) # Added submission_url

                    replies_data = comment.get('replies', {})
                    if isinstance(replies_data, dict) and 'data' in replies_data and 'children' in replies_data['data']:
                        replies = replies_data['data']['children']
                        extracted_comments.extend(extract_comments(replies, comment_id))
            return extracted_comments

        for comment_data in comments:
            if comment_data['kind'] == 't1':
                comment = comment_data['data']
                comment_id = comment.get('id', 'unknown')
                comment_author = comment.get('author', '[deleted]')
                comment_body = comment.get('body', '[deleted]')
                comment_score = comment.get('score', 0)
                comment_depth = comment.get('depth', 0)
                timestamp = comment.get('created_utc', 0)
                dt_object = datetime.fromtimestamp(timestamp, UTC)
                comment_date = dt_object.strftime('%Y-%m-%d')
                comment_time = dt_object.strftime('%H:%M:%S')
                comments_data.append([submission_id, comment_body, comment_id, comment_time, comment_date, comment_score, comment_depth, comment_author, submission_id, submission_url]) # Added submission_url
                replies_data = comment.get('replies', {})
                if isinstance(replies_data, dict) and 'data' in replies_data and 'children' in replies_data['data']:
                    replies = replies_data['data']['children']
                    comments_data.extend(extract_comments(replies, comment_id))

    except Exception as e:
        print(f"Error processing URL: {submission_url} - {e}")
        return pd.DataFrame() 

    df = pd.DataFrame(comments_data, columns=["Post ID", "Comment", "comment_id", "Time", "Date", "Score", "Depth", "Author", "Parent ID", "Submission URL"]) 
    print(len)
    return df


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/process_urls")
async def process_urls(urls: str = Form(...)): # Expecting URLs as a form data
    url_list = urls.strip().split('\n') # Split URLs by newline
    all_dfs = []

    for url in url_list:
        url = url.strip() # remove leading/trailing spaces
        if url: # process only non-empty urls
            df = scrape_reddit_comments(url)
            if not df.empty: # Only append if DataFrame is not empty (scraping was successful)
                all_dfs.append(df)

    if not all_dfs: # if no dataframes were collected (all failed or no URLs)
        return PlainTextResponse("No data could be scraped from the provided URLs.", status_code=400)

    combined_df = pd.concat(all_dfs, ignore_index=True)
    csv_output = combined_df.to_csv(index=False)

    headers = {
        "Content-Disposition": "attachment; filename=reddit_comments.csv" # Suggest download
    }
    return PlainTextResponse(csv_output, headers=headers, media_type="text/csv") # Return CSV as response






from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response
from io import StringIO
import pandas as pd
import time
import random
import requests
import praw
from prawcore.exceptions import ResponseException, RequestException
from openai import OpenAI



requests.packages.urllib3.disable_warnings()

class CustomRequestor(praw.reddit.Requestor):
    def __init__(self, *args, **kwargs):
        super(CustomRequestor, self).__init__(*args, **kwargs)
        self._http = requests.Session()
        self._http.verify = False 

        self._http.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Cache-Control': 'max-age=0',
        })

def get_reddit_instance(client_id, client_secret, user_agent):
    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent,
        requestor_class=CustomRequestor,
        check_for_updates=False,
        comment_kind="t1",
        message_kind="t4",
        redditor_kind="t2",
        submission_kind="t3",
        subreddit_kind="t5",
        trophy_kind="t6",
        oauth_url="https://oauth.reddit.com",
        reddit_url="https://www.reddit.com",
        short_url="https://redd.it",
        ratelimit_seconds=5,  
        timeout=30,  
    )
    return reddit

token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVsYXR1cmkuYmhhbnVAZ3JhbWVuZXIuY29tIn0.NIZbpbZvAPBGjoEDIM7PoDPdJm9Q6lMygCQgaWz5GdY'
def chat(prob_statment):
    client = OpenAI(
        api_key=f"{token}:my-test-project",
        base_url="https://llmfoundry.straive.com/openai/v1/",
    )
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0,
            messages=[
                {
                    "role":"user",
                    "content": prob_statment
                }
            ],
        )
        result = response.choices[0].message.content
        return result
    except Exception as e:
        print(f"Error during chat API call: {e}")
        return "Error in summarization" 

reddit = get_reddit_instance(
    client_id="jnFC40RylRkrfIRGI9adeA",
    client_secret="ar8ge4EimhhPyNdVUDdbAMKdteNmdQ",
    user_agent="Imaginary-Cow1225", 
)

def reddit_api_call(func, *args, **kwargs):
    max_retries = 10  
    retry_delay = 0  

    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
        except ResponseException as e:
            if e.response.status_code == 429:  
                retry_delay *= 2 
            elif e.response.status_code == 503: 
                time.sleep(retry_delay)
                retry_delay *= 2
            else:
                print(f"Reddit API error: {e.response.status_code}. Retry {attempt+1}/{max_retries}")
                time.sleep(retry_delay)
                retry_delay *= 1.5  
        except RequestException as e:
            print(f"Request error: {e}. Retry {attempt+1}/{max_retries}")
            time.sleep(retry_delay)
            retry_delay *= 2
        except Exception as e:
            print(f"Unexpected error: {e}. Retry {attempt+1}/{max_retries}")
            time.sleep(retry_delay)
            retry_delay *= 2

    raise Exception(f"Failed after {max_retries} retries. Consider reducing the number of requests or increasing delays.")


def process_reddit_url(url, df_excel_str):
    df_new_data_list = [] 

    try:
        print(f"Processing URL: {url}")

        submission = reddit_api_call(reddit.submission, url=url)
        print("Loading all comments (this may take a while)...")
        try:
            reddit_api_call(submission.comments.replace_more, limit=None, threshold=0)
            print(f"Successfully loaded all comments for URL")
        except Exception as e:
            print(f"Warning: Could not load all comments: {e}")
            print("Continuing with partially loaded comments...")
            delay = 30 + (random.random() * 10)  
            print(f"Waiting {delay:.1f} seconds before continuing...")
            time.sleep(delay)
    except Exception as e:
        print(f"Error processing URL: {e}")
        return pd.DataFrame() 

    all_comments = []
    try:
        print("Retrieving comments (approach 1)...")
        submission_comments = submission.comments

        try:
            print("Expanding comment forest...")
            all_comments = submission_comments.list()
            total_comments = len(all_comments)
            print(f"Successfully retrieved {total_comments} comments")
        except Exception as e:
            print(f"Could not expand all comments: {e}")
            print("Falling back to top-level comments only...")
            all_comments = list(submission_comments)
            total_comments = len(all_comments)
            print(f"Retrieved {total_comments} top-level comments")
    except Exception as e:
        print(f"Error retrieving any comments: {e}")
        print("Attempting final fallback method...")

        try:
            print("Retrieving a limited number of comments...")
            submission.comment_limit = 10  
            submission.comment_sort = "top"  
            all_comments = list(submission.comments)
            total_comments = len(all_comments)
            print(f"Retrieved {total_comments} limited comments")

            if total_comments == 0:
                print("No comments could be retrieved. Skipping this URL.")
                return pd.DataFrame()
        except Exception as e2:
            print(f"Fatal error accessing comments: {e2}")
            print("Skipping this URL due to comment access failure")
            return pd.DataFrame() 

    print(f"Processing {len(all_comments)} comments...")

    submission_data = []

    for i, comment in enumerate(all_comments):
        if i % 100 == 0:
            print(f"Processing comment {i}/{len(all_comments)} ({i/len(all_comments)*100:.1f}%)")

        if isinstance(comment, praw.models.MoreComments):
            continue  

        if comment.author is None:
            continue

        try:
            submission_data.append([
                submission.title,
                submission.score,  
                len(submission.comments),
                comment.id,  
                comment.author,
                comment.body,
                comment.score,  
                len(comment.replies), 
                pd.to_datetime(comment.created_utc, unit='s'), 
                pd.to_datetime(submission.created_utc, unit='s') 
            ])
        except Exception as e:
            print(f"Error processing comment {comment.id}: {e}")
            continue

    print(f"Successfully processed {len(submission_data)}/{len(all_comments)} comments")

    del all_comments

    df = pd.DataFrame(submission_data, columns=['Post','post_score','post_comment_count',"ID", "Author", "Body", "Score", "Number of Replies", "Comment Timestamp", "Post Timestamp"])

    df = df.rename(columns={
        "Post": "Post",
        "post_score":"post_score",
        "post_comment_count":"post_comment_count",
        "ID": "ID",
        "Author": "Author",
        "Body": "Body",
        "Score": "Score",
        "Number of Replies": "Number_of_Replies",
        "Comment Timestamp": "Comment_Timestamp",
        "Post Timestamp": "Post_Timestamp"
    })
 
    def response_rate(df):
        df['Comment_Hour'] = df['Comment_Timestamp'].dt.hour
        df['Comment_Date'] = df['Comment_Timestamp'].dt.date

        df['Three_Hour_Interval'] = (df['Comment_Hour'] // 3) * 3

        comments_per_3_hours = df.groupby(['Comment_Date', 'Three_Hour_Interval'])['ID'].count().reset_index()
        comments_per_3_hours = comments_per_3_hours.rename(columns={'ID': 'Number_of_Comments'})

        avg_comments = comments_per_3_hours['Number_of_Comments'].mean()

        max_response_timestamp = comments_per_3_hours.loc[comments_per_3_hours['Number_of_Comments'].idxmax()]
        max_response_date = max_response_timestamp['Comment_Date']
        max_response_3hr_interval = max_response_timestamp['Three_Hour_Interval']

        return avg_comments, f"{max_response_date} {max_response_3hr_interval}:00:00"

    def predict_sentiment(df):
        positive_count = 0
        total_count = 0

        print(f"Analyzing sentiment for {len(df)} comments...")

        # Preprocessing: Filter and trim comments
        df = df[df['Body'].notna()]
        df['Body'] = df['Body'].astype(str).str.strip()
        df = df[df['Body'].str.len() >= 5]
        df['Body'] = df['Body'].apply(lambda x: x[:200] + "..." if len(x) > 200 else x)

        comments_to_process = list(df['Body'].items())
        print(f"Found {len(comments_to_process)} valid comments to analyze.")

        chunk_size = 100
        total_chunks = (len(comments_to_process) + chunk_size - 1) // chunk_size

        def process_chunk(chunk, chunk_idx):
            nonlocal positive_count, total_count
            
            combined_text = "\n\n".join([f"COMMENT {j+1}: {text[:150]}" for j, (idx, text) in enumerate(chunk)])
            prompt = f"""Analyze the sentiment of each of the following comments.
    For each comment, respond ONLY with the comment number followed by either "positive" or "negative".
    Format your response exactly like this:
    COMMENT 1: positive
    COMMENT 2: negative
    etc.

    {combined_text}"""

            try:
                print(f"Processing chunk {chunk_idx+1}/{total_chunks} ({len(chunk)} comments)...")
                sentiment_results = chat(prompt).strip().split('\n')

                for j, (idx, _) in enumerate(chunk):
                    for line in sentiment_results:
                        if line.lower().startswith(f"comment {j+1}:"):
                            result = line.split(':', 1)[1].strip().lower()
                            is_positive = "positive" in result
                            
                            if is_positive:
                                positive_count += 1
                            total_count += 1
                            break

            except Exception as e:
                print(f"Error processing chunk {chunk_idx+1}: {e}")

        for i in range(0, len(comments_to_process), chunk_size):
            process_chunk(comments_to_process[i:i+chunk_size], i//chunk_size)

        # Summary
        percentage_positive = (positive_count / total_count) * 100 if total_count > 0 else 0
        print(f"\nSentiment analysis complete: {positive_count}/{total_count} positive comments ({percentage_positive:.2f}%)")

        return percentage_positive

    
    def calculate_fan_retention_rate(df):
        unique_authors = len(df['Author'].unique())
        
        avg_score = df['Score'].mean()
        avg_replies = df['Number_of_Replies'].mean()
        
        if len(df) > 1:
            time_span = (df['Comment_Timestamp'].max() - df['Comment_Timestamp'].min()).total_seconds() / 3600
        else:
            time_span = 0
            
        author_comment_counts = df['Author'].value_counts()
        repeat_commenters = len(author_comment_counts[author_comment_counts > 1])
        repeat_ratio = repeat_commenters / unique_authors if unique_authors > 0 else 0
        
        engagement_score = (
            unique_authors * 0.3 +      
            avg_score * 0.2 +           
            avg_replies * 0.2 +         
            time_span * 0.1 +           
            repeat_ratio * 0.2          
        )
        
        if engagement_score >= 10:
            return "High"
        elif engagement_score >= 5:
            return "Medium"
        else:
            return "Low"
    
    def identify_top_fan_voice(df):
        if len(df) == 0:
            return "No active fans"
            
        usernames = []
        author_to_username = {}
        
        for _, row in df.iterrows():
            if row['Author'] is not None:
                username = str(row['Author'])
                usernames.append(username)
                author_to_username[row['Author']] = username
        
        if not usernames:
            return "No active fans"
            
        # Create a new DataFrame with usernames instead of Redditor objects
        data = []
        for _, row in df.iterrows():
            if row['Author'] is not None:
                data.append({
                    'Username': author_to_username[row['Author']],
                    'ID': row['ID'],
                    'Score': row['Score'],
                    'Number_of_Replies': row['Number_of_Replies'],
                    'Body': row['Body']
                })
        
        if not data:
            return "No active fans"
            
        # Create a new DataFrame with the extracted data
        df_users = pd.DataFrame(data)
        
        # Group by Username and calculate metrics
        author_metrics = df_users.groupby('Username').agg({
            'ID': 'count',                      # Number of comments
            'Score': ['sum', 'mean'],           # Total and average score
            'Number_of_Replies': 'sum'          # Total replies received
        })
        
        # Flatten the multi-index columns
        author_metrics.columns = ['comment_count', 'total_score', 'avg_score', 'total_replies']
        
        # Calculate mention count (how many times the author is mentioned in other comments)
        mention_counts = {}
        for username in author_metrics.index:
            # Count mentions in comment bodies (assuming Reddit username format u/username)
            mention_pattern = f"u/{username}"
            mentions = df_users['Body'].str.contains(mention_pattern, case=False).sum()
            mention_counts[username] = mentions
            
        author_metrics['mention_count'] = pd.Series(mention_counts)
        author_metrics['mention_count'] = author_metrics['mention_count'].fillna(0)
        
        # Calculate influence score
        author_metrics['influence_score'] = (
            (author_metrics['comment_count'] / author_metrics['comment_count'].max() if author_metrics['comment_count'].max() > 0 else 0) * 0.3 +
            (author_metrics['total_score'] / author_metrics['total_score'].max() if author_metrics['total_score'].max() > 0 else 0) * 0.25 +
            (author_metrics['avg_score'] / author_metrics['avg_score'].max() if author_metrics['avg_score'].max() > 0 else 0) * 0.15 +
            (author_metrics['total_replies'] / author_metrics['total_replies'].max() if author_metrics['total_replies'].max() > 0 else 0) * 0.2 +
            (author_metrics['mention_count'] / author_metrics['mention_count'].max() if author_metrics['mention_count'].max() > 0 else 0) * 0.1
        )
        
        # Find the top fan
        if len(author_metrics) > 0:
            top_fan = author_metrics['influence_score'].idxmax()
            influence_score = author_metrics.loc[top_fan, 'influence_score']
            mention_count = author_metrics.loc[top_fan, 'mention_count']
            
            # Format as requested: 'Username + Mention Count + Influence Score'
            return f"{top_fan}, {int(mention_count)}, {influence_score:.2f}"
        else:
            return "No influential fans"
 
    def count_i_occurrences(df):
      id_counts = df['ID'].value_counts()
      result = 0
      if (id_counts > 2).any():
          result = len(id_counts[id_counts > 2])
      return result
    
    a = df['Post'].to_string()
    b = df['Body'].to_string()
    df_excel = pd.read_excel('inst.xlsx')
    k = df_excel.to_string()
    prob_statment = f'summerize {b} with repect to sentiment and other important factor  in 150 word'
    sum_b = chat(prob_statment)
    prob_statment = f"""Use {k} to uderstand the columns and their definition for and apply on {sum_b} and
    give me in table output , summerized_comment = {sum_b}
    and rest other column from {k}
    I want a table having columns named as 'Sentiment Score', 'Emotion Type', 'Toxicity Score',
          'Fan Clusters', 'Topics of Interest', 'Location Inference',
          'Trigger Words / Hashtags', 'Fan Inquiry Rate',
          'Purchase Intent Score', 'In-Stadium Signals',
          'Sponsor/Brand Mentions', 'Brand Sentiment',
          'Fan Engagement Score', 'Monetization Opportunity',
          'AI Action Tag', 'Primary Topic (Post)',
          'Evolved Narrative (Conversation)',
          'Trending Themes (Crowd Momentum)',
          'Platform'
          and value define by the definition in {k}
          if you are not able to predict any value then put 'NA'
          give me output in tabular form to store 
          Note:For 'Trigger Words / Hashtags' find out multiple words that can actually trigger something."""
    out = chat(prob_statment)
    if out == "Error in summarization": 
        return pd.DataFrame()

    out = out.split('\n\n')
    out = out[1]
    p = out.split('\n')
    p = p[:1] + p[2:]
    data = []
    header = p[0].split('|')[1:-1]  
    header = [item.strip() for item in header]

    for row_str in p[1:]:
        row = row_str.split('|')[1:-1]  
        row = [item.strip() for item in row]
        data.append(row)

    df_p = pd.DataFrame(data, columns=header)
    df_p.columns = [col.replace('**', '').strip() for col in df_p.columns]
    df_final = df_p.copy()
    df_final['post'] = df['Post'].iloc[0] if not df['Post'].empty else 'NA' 
    df_final['summarized_comment'] = sum_b
    df_final['url'] = url
    engagement_velocity, peak_timestamp = response_rate(df)
    df_final['reapeat_id'] = count_i_occurrences(df)
    df_final['Engagement_Velocity'] = engagement_velocity
    df_final['Peak_Activity_Time'] = peak_timestamp
    df_final['positive_sentiment_percentage'] = predict_sentiment(df) 
    df_final['post_comment_count'] = df['post_comment_count'].max() if not df['post_comment_count'].empty else 0 
    df_final['post_score'] = df['post_score'].max() if not df['post_score'].empty else 0
    df_final['Fan Retention Rate'] = calculate_fan_retention_rate(df)
    df_final['Post Timestamp'] = df['Post_Timestamp'].iloc[0] if not df['Post'].empty else 'NA' 
 
    try:
        top_fan_result = identify_top_fan_voice(df)
        print(f"Top Fan Voice result: {top_fan_result}")
        df_final['Top Fan Voice'] = top_fan_result
    except Exception as e:
        print(f"Error in identify_top_fan_voice: {e}")
        df_final['Top Fan Voice'] = f"Error: {str(e)}"
    new_column_order = [ 'post', 'summarized_comment','url', 'Engagement_Velocity', 'Peak_Activity_Time', 'Fan Retention Rate', 'Top Fan Voice']
    column_2 =  new_column_order+ [col for col in df_final.columns if col not in new_column_order]
    df_final_3 = df_final[column_2]
    

    return df_final_3

import csv
@app.post("/post_table")
async def create_post_table(url_list: List[str] = Form(...)):
    """
    Endpoint to generate a post table from Reddit URLs provided as form data.
    Expects:
    - inst_file: Excel file (.xlsx) containing column definitions.
    - url_list: A list of Reddit URLs provided as form data.
    """
    try:
        file_path = os.path.join(os.getcwd(), 'inst.xlsx') 
        df_excel = pd.read_excel(file_path)
        df_excel_str = df_excel.to_string()

        print(df_excel_str)
        df_new_data_list = []

        for url in url_list:
            try:
                df_result_url = process_reddit_url(url, df_excel_str)
                if not df_result_url.empty:
                    df_new_data_list.append(df_result_url)
            except Exception as e:
                print(f"Error processing URL {url}: {e}")

        if not df_new_data_list:
            return Response(content="No data processed successfully. Please check logs for errors.", media_type="text/plain", status_code=500)

        df_new_data = pd.concat(df_new_data_list, ignore_index=True)

        # csv_output = df_new_data.to_csv(index=False)
        csv_output = df_new_data.to_csv(index=False, quoting=csv.QUOTE_MINIMAL, quotechar='"')
        return Response(content=csv_output, media_type="text/csv", headers={"Content-Disposition": "attachment;filename=reddit_analysis_results.csv"})

    except Exception as e:
        print(f"General error processing request: {e}")
        return HTTPException(status_code=500, detail=f"Internal server error: {e}")
    

SAMPLE_DATA_FOLDER = "sample_data"

@app.get("/files/{file_name}")
async def serve_file(file_name: str):
    file_path = os.path.join(SAMPLE_DATA_FOLDER, file_name)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path)