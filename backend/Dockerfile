# IMPORTANT: this Dockerfile expects the Docker BUILD CONTEXT to be the
# repository ROOT (not the backend/ folder), because it needs access to the
# sibling ml/ directory to generate data and train the model at build time.
#
# On Render: set "Docker Build Context Directory" to blank / "." (repo root),
# and "Dockerfile Path" to backend/Dockerfile.

FROM python:3.11-slim
WORKDIR /repo

# Install Python deps first (better layer caching)
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the whole monorepo (backend/ + ml/ + docs/, etc.)
COPY . .

# Generate synthetic data, train the model, and build the SQLite DB — all at
# image-build time, so the running container always has a trained model and
# a populated database, with no manual post-deploy step required.
RUN python ml/generate_dataset.py \
    && python ml/train_model.py \
    && cd backend && python app/database/setup_db.py

WORKDIR /repo/backend
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]