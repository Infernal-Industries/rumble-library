import os
import logging
from moviepy.editor import VideoFileClip

input_dir = 'Input/Clips'
output_dir = 'assets/Clips'

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def convert_to_gif(filename):
    input_path = os.path.join(input_dir, filename)
    output_filename = os.path.splitext(filename)[0] + '.gif'
    output_path = os.path.join(output_dir, output_filename)

    if not os.path.exists(output_path):
        try:
            logging.info(f'Converting {filename} to GIF...')
            clip = VideoFileClip(input_path)
            if clip.duration == 0:
                logging.error(f'Error: {filename} has zero duration.')
                return
            clip.write_gif(output_path)
            logging.info(f'Saved GIF to {output_path}')
        except Exception as e:
            logging.error(f'Error converting {filename}: {e}')
    else:
        logging.info(f'Skipping {filename}, GIF already exists.')

def main():
    for filename in os.listdir(input_dir):
        if filename.endswith(('.mp4', '.avi', '.mov', '.mkv')):
            convert_to_gif(filename)

if __name__ == '__main__':
    main()