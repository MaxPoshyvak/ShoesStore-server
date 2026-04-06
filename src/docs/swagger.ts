import type { Express, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';

function loadOpenApiDocument() {
    const specPath = path.resolve(process.cwd(), 'documentation', 'swagger', 'openapi.yaml');
    const raw = fs.readFileSync(specPath, 'utf8');
    return YAML.parse(raw);
}

export function mountSwagger(app: Express) {
    app.get('/openapi.yaml', (req: Request, res: Response) => {
        const specPath = path.resolve(process.cwd(), 'documentation', 'swagger', 'openapi.yaml');
        res.type('text/yaml').send(fs.readFileSync(specPath, 'utf8'));
    });

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(loadOpenApiDocument(), { explorer: true }));
}

