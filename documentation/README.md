# ShoesStore Server Documentation

This folder contains **project documentation** and the **Swagger (OpenAPI) specification**.

## Swagger UI

When the server is running, open:

- `GET /docs` – interactive Swagger UI
- `GET /openapi.yaml` – raw OpenAPI YAML

## OpenAPI spec location

- `documentation/swagger/openapi.yaml`

## Auth

Most endpoints are protected with **Bearer JWT**:

- Send header: `Authorization: Bearer <token>`
- Get a token via `POST /api/users/login`
