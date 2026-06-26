# Testing the Materials API

## Start the Server

```bash
cd backend/know_nook_backend
npm start
```

Server should start on `http://localhost:5500`

## Test Endpoints

### 1. Test GET (Empty)
```bash
curl http://localhost:5500/api/materials
```
Expected: `[]`

### 2. Test POST (Add Material)
```bash
curl -X POST http://localhost:5500/api/materials \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test Material\",\"description\":\"A test resource\",\"category\":\"Textbooks\",\"author\":\"Test User\",\"difficulty\":\"Easy\",\"tags\":\"test,demo\",\"link\":\"https://example.com\"}"
```
Expected: JSON object with generated ID

### 3. Test GET (With Data)
```bash
curl http://localhost:5500/api/materials
```
Expected: Array with the material you just added

### 4. Test Filters
```bash
curl "http://localhost:5500/api/materials?difficulty=Easy"
curl "http://localhost:5500/api/materials?category=Textbooks"
curl "http://localhost:5500/api/materials?q=test"
```

## Frontend Testing

1. Start the backend server (port 5500)
2. Open `frontend/pages/materials.html` in your browser
3. Click the "+" button to add a material
4. Fill in the form and submit
5. The new material should appear instantly in the grid

## Validation Tests

### Should Fail (No Title)
```bash
curl -X POST http://localhost:5500/api/materials \
  -H "Content-Type: application/json" \
  -d "{\"link\":\"https://example.com\"}"
```
Expected: 400 error

### Should Fail (Invalid URL)
```bash
curl -X POST http://localhost:5500/api/materials \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test\",\"link\":\"not-a-url\"}"
```
Expected: 400 error

### Should Use Fallback Image
```bash
curl -X POST http://localhost:5500/api/materials \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"No Image\",\"link\":\"https://example.com\",\"thumbnailUrl\":\"\"}"
```
Expected: Material created with placeholder image URL
