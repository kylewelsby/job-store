import mongoose from 'mongoose'
import Company from './Company'
import Job from './Job'
import Taxonomy from './Taxonomy'

mongoose.Promise = global.Promise

export const connect = (uri) => {
  return mongoose.connect(uri, { useNewUrlParser: true, useFindAndModify: false })
}

export const disconnect = () => {
  return mongoose.disconnect()
}

export const models = {
  Company,
  Job,
  Taxonomy
}
