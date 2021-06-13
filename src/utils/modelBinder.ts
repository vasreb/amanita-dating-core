/* чтобы биндер работал объект должен инициировать хоть как то свои свойства по умолчанию */

function bindModel(Model) {
  return function (req, res, next) {
    var obj = new Model();
    for (var key in obj) {
      if (typeof obj[key] !== 'function' && req.body) {
        for (var param in req.body) {
          if (key.toLowerCase() == param.toLowerCase()) {
            obj[key] = req.body[param];
          }
        }
      }
    }
    req.requestModel = obj;
    next();
  };
}

export default bindModel;
