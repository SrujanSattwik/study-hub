import { Request, Response, NextFunction } from 'express';
import { MaterialsService } from '../services/materials.service';
import { getMaterialsQuerySchema, uploadMaterialSchema } from '../validators/materials.validator';
import { BadRequestError } from '../utils/errors';

const materialsService = new MaterialsService();

export class MaterialsController {
  async getMaterials(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getMaterialsQuerySchema.parse(req.query);
      const result = await materialsService.list(
        query.type,
        query.page,
        query.limit,
        query.user_id
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async uploadMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      const body = uploadMaterialSchema.parse(req.body);

      if (!file && !body.link) {
        throw new BadRequestError('Either file or link is required');
      }

      if (!req.user || !req.user.user_id) {
        throw new BadRequestError('User details missing from request');
      }

      const result = await materialsService.upload({
        title: body.title,
        description: body.description,
        link: body.link,
        type: body.type,
        author: body.author,
        subject: body.subject,
        difficulty: body.difficulty,
        userId: req.user.user_id,
        file
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async downloadMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Material ID is required');
      }
      const result = await materialsService.trackDownload(id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
export const materialsController = new MaterialsController();
