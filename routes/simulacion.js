const { Router } = require("express");
const { check } = require("express-validator");
// const { chromium } = require("playwright");
const {
  validarCampos,
  validarJWT,
  esAdminRole,
  tieneRole,
} = require("../middlewares");

const {
  //esRoleValido,
  // emailExiste,
  // existeUsuarioPorId,
  // nitExiste,
  existeContratoPorId,
  existeSimluacionPorId,
  existeSimulacionPorId,
} = require("../helpers/db-validators");
const {
  simulacionGets,
  simulacionGet,
  simulacionPut,
  simulacionPost,
  simulacionDelete,
  simulacionPatch,
} = require("../controllers/simulacion");

const router = Router();

//Ruta para obtener brent

// router.get("/brent", async (req, res) => {
//   const browser = await chromium.launch();
//   const context = await browser.newContext();
//   const page = await context.newPage();

//   await page.route("**/*", async (route) => {
//     const request = route.request();
//     const headers = {
//       ...request.headers(),
//       "User-Agent":
//         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
//       "Accept-Language": "en-US,en;q=0.9",
//       Referer: "https://www.google.com/",
//     };

//     await route.continue({ headers });
//   });

//   await page.goto("https://tradingeconomics.com/commodity/brent-crude-oil");

//   const brent = await page
//     .locator("table tr:nth-child(2) td:nth-child(2)")
//     .first()
//     .innerText();

//   return res.json({
//     brent,
//   });
// });

router.get("/", simulacionGets);
router.get(
  "/:id",
  [
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeSimluacionPorId ),
    validarCampos,
  ],
  simulacionGet
);
router.put(
  "/:id",
  [
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeSimulacionPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  simulacionPut
);

router.post(
  "/",
  [
    //Validación de campos.
    //check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    //check("nombre", "El nombre delsimulacion es obligatorio").not().isEmpty(),
    //check("capacidad", "La capacidad delsimulacion es obligatoria")
    //  .not()
    //.isEmpty(),
    // check("material", "El material delsimulacion es obligatoria").not().isEmpty(),
    // validarCampos,
  ],
  simulacionPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    // esAdminRole,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeSimulacionPorId),
    validarCampos,
  ],
  simulacionDelete
);

router.patch("/", simulacionPatch);

module.exports = router;
