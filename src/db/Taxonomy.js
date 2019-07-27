import mongoose from 'mongoose'

const Schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
})

export default mongoose.model('Taxonomy', Schema)
