import type { ErrorRequestHandler } from "express";

import SuccessErrorDto from "../models/SuccessErrorDto";

const errorMiddleware: ErrorRequestHandler = (err: Error, req, res, next) => {
    const dto = new SuccessErrorDto();
    dto.errorMessage = err.message;
    res.status(500).json(dto);
};

export default errorMiddleware;