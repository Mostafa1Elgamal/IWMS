const Material = require('../models/Material')
const CutOff = require('../models/CutOff')

const addMaterial = async (req, res) => {
  const material = await Material.create(req.body)
  res.status(201).json(material)
}

const getMaterials = async (req, res) => {
  const materials = await Material.find()
  const availableCutOffs = await CutOff.find({ status: 'available' });

  const withAlerts = materials.map(m => {
    let availableCutOffsCount = 0;
    let availableCutOffsArea = 0;
    let totalEquivalentQuantity = m.quantity_in_stock;

    if (m.sheetDimensions && m.sheetDimensions.width && m.sheetDimensions.height) {
      const cutoffsForMaterial = availableCutOffs.filter(c => c.material.toString() === m._id.toString());
      availableCutOffsCount = cutoffsForMaterial.length;
      availableCutOffsArea = cutoffsForMaterial.reduce((sum, c) => sum + ((c.dimensions?.width || 0) * (c.dimensions?.height || 0)), 0);

      const fullSheetArea = m.sheetDimensions.width * m.sheetDimensions.height;
      if (fullSheetArea > 0) {
        totalEquivalentQuantity += (availableCutOffsArea / fullSheetArea);
      }
    }

    return {
      ...m._doc,
      availableCutOffsCount,
      availableCutOffsArea,
      lowStock: totalEquivalentQuantity <= (m.min_threshold || 10)
    };
  })
  res.json(withAlerts)
}

const deleteMaterial = async (req, res) => {
  const material = await Material.findByIdAndDelete(req.params.id)
  if (!material) return res.status(404).json({ message: 'Material not found' })
  await CutOff.deleteMany({ material: req.params.id })
  res.json({ message: 'Material and associated cut-offs deleted' })
}

const updateMaterial = async (req, res) => {
  const material = await Material.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' })
  res.json(material)
}

const addCutOff = async (req, res) => {
  const cutoffsData = req.body
  if(Array.isArray(cutoffsData)){
    const createdCutoffs = await CutOff.insertMany(cutoffsData)

    res.status(201).json(createdCutoffs)
  } else{
    const cutoff = await CutOff.create(cutoffsData)
    res.status(201).json(cutoff)
  }
}

const getCutOffs = async (req, res) => {
  const cutoffs = await CutOff.find({ status: 'available' }).populate('material')
  res.json(cutoffs)
}

const updateCutOffStatus = async (req, res) => {
  const { status } = req.body
  const cutoff = await CutOff.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' })
  if (!cutoff) return res.status(404).json({ message: 'CutOff not found' })
  res.json(cutoff)
}

const getDeadStock = async (req,res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)  

  const deadStock = await Material.find({
    updatedAt: {$lte : sixMonthsAgo},
    quantity_in_stock: { $gt: 0 }
  })

  res.json(deadStock)
}

module.exports = { addMaterial, getMaterials, updateMaterial, deleteMaterial, addCutOff, getCutOffs, updateCutOffStatus, getDeadStock }