import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common/exceptions';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handdleException(error);
    }
  }

  findAll() {
    return;
  }

  async findOne(term: string) {
    let pokemon: Pokemon;

    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    }

    // MongoID
    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }

    // Name
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase() });
    }

    if (!pokemon)
      throw new NotFoundException(
        `Pokemon with id, name or no"${term}" not found`,
      );
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);
    if (updatePokemonDto.name)
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();

    try {
      await pokemon.updateOne(updatePokemonDto);
      return { ...pokemon.toJSON(), ...updatePokemonDto };
    } catch (error) {
      this.handdleException(error);
    }
  }

  async remove(id: string) {
    // const pokemon = await this.findOne(id);
    // await pokemon.deleteOne();
    // const result = this.pokemonModel.findByIdAndDelete(id);
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });
    if (deletedCount === 0) {
      throw new BadRequestException(` Pokemon with id "${id}" not found`);
    }
    return { deletedCount };
  }

  //
  private handdleException(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(
        `Pokemon exist in db ${JSON.stringify(error.keyValue)}`,
      );
    }
    console.log(error);
    throw new InternalServerErrorException(
      `Cant create Pokemon - Check Server logs`,
    );
  }
}
