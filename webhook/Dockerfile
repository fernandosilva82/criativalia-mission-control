FROM python:3.11-slim

WORKDIR /app

RUN pip install flask requests

COPY webhook-hub.py .

EXPOSE 5555

CMD ["python", "webhook-hub.py"]
