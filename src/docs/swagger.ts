import type { Express, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';

function loadYamlFile(filePath: string): Record<string, unknown> {
    const raw = fs.readFileSync(filePath, 'utf8');
    return YAML.parse(raw) as Record<string, unknown>;
}

function loadOpenApiDocument() {
    const swaggerDir = path.resolve(process.cwd(), 'documentation', 'swagger');

    // Load main entry point
    const main = loadYamlFile(path.join(swaggerDir, 'openapi.yaml')) as Record<string, unknown>;

    // Load and merge paths from each path file
    const pathsDir = path.join(swaggerDir, 'paths');
    const mergedPaths: Record<string, unknown> = {};
    if (fs.existsSync(pathsDir)) {
        const pathFiles = fs.readdirSync(pathsDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
        for (const file of pathFiles) {
            const pathDoc = loadYamlFile(path.join(pathsDir, file)) as Record<string, unknown>;
            Object.assign(mergedPaths, pathDoc);
        }
    }
    main.paths = mergedPaths;

    // Load and merge components from schemas.yaml
    const schemasPath = path.join(swaggerDir, 'schemas.yaml');
    if (fs.existsSync(schemasPath)) {
        const schemasDoc = loadYamlFile(schemasPath) as Record<string, unknown>;
        main.components = schemasDoc.components;
    }

    return main;
}

export function mountSwagger(app: Express) {
    app.get('/openapi.yaml', (req: Request, res: Response) => {
        const specPath = path.resolve(process.cwd(), 'documentation', 'swagger', 'openapi.yaml');
        res.type('text/yaml').send(fs.readFileSync(specPath, 'utf8'));
    });

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(loadOpenApiDocument(), { explorer: true }));
}
