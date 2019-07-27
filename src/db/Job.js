import mongoose from 'mongoose'

const Schema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['REMOTE_OK'],
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: true,
    index: true
  },
  position: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxonomy'
    }
  ],
  publishedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
})

Schema.index({ provider: 1, company: 1, position: 1, publishedAt: 1 }, { unique: true })

export default mongoose.model('Job', Schema)
