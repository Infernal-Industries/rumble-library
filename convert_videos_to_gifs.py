import os
import logging
from moviepy.editor import VideoFileClip

input_dir = 'Input/Clips'
output_dir = 'assets/Clips'

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Create output directory if it doesn't exist
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

def convert_to_gif(filename):
    input_path = os.path.join(input_dir, filename)
    output_filename = os.path.splitext(filename)[0] + '.gif'
    output_path = os.path.join(output_dir, output_filename)

    # Check if input file exists
    if not os.path.exists(input_path):
        logging.error(f'Input file not found: {input_path}')
        return

    if not os.path.exists(output_path):
        clip = None
        try:
            logging.info(f'Converting {filename} to GIF...')
            logging.info(f'Input path: {input_path}')
            
            # Load the video
            clip = VideoFileClip(input_path)
            original_fps = clip.fps
            
            logging.info(f'Original video stats - FPS: {original_fps}')
            
            # Just resize, maintain original speed and fps
            clip = clip.resize(width=1080)
            
            # Try using a higher FPS for the GIF
            output_fps = min(original_fps, 60)  # Cap at 60 FPS for file size
            
            logging.info(f'Writing GIF with FPS: {output_fps}')
            # Write the GIF with additional options
            clip.write_gif(
                output_path,
                fps=output_fps,
                program='ffmpeg',
                opt='optimizeplus',  # Use optimization
                fuzz=10  # Reduce colors slightly for better file size
            )
            
            logging.info(f'Saved GIF to {output_path}')
        except Exception as e:
            logging.error(f'Error converting {filename}: {str(e)}')
        finally:
            if clip is not None:
                clip.close()

def main():
    # Check if input directory exists
    if not os.path.exists(input_dir):
        logging.error(f'Input directory not found: {input_dir}')
        logging.info(f'Creating input directory: {input_dir}')
        os.makedirs(input_dir)
        logging.info(f'Please place your video files in: {os.path.abspath(input_dir)}')
        return

    # Check if there are any video files
    video_files = [f for f in os.listdir(input_dir) if f.endswith(('.mp4', '.avi', '.mov', '.mkv'))]
    if not video_files:
        logging.error(f'No video files found in {input_dir}')
        logging.info(f'Please add video files to: {os.path.abspath(input_dir)}')
        return

    for filename in video_files:
        convert_to_gif(filename)

if __name__ == '__main__':
    main()