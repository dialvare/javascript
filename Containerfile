# Use an official Python runtime as the base image
FROM registry.access.redhat.com/ubi9/python-311

# Set the working directory in the container
WORKDIR /app

USER root
RUN dnf install -y libpng

# Install Python dependencies
RUN pip install opencv-python-headless Pillow numpy flask flask_socketio eventlet gevent gevent-websocket
RUN git clone https://github.com/ultralytics/yolov5 && cd yolov5 && sed -i s/'opencv-python>'/'opencv-python-headless>'/g requirements.txt && pip install -r requirements.txt && pip uninstall -y opencv-python && pip install --force-reinstall opencv-python-headless

# Expose the port if needed
EXPOSE 5000

ENV LD_LIBRARY_PATH=/usr/lib64:/usr/lib64/openmpi/lib/:$LD_LIBRARY_PATH

USER 1001

# Copy the code into the container
COPY . /app

# Run the script when the container launches
CMD ["python3", "app.py"]
