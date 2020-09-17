using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using DatingApp.API.Data;
using DatingApp.API.Dtos;
using DatingApp.API.Helpers;
using DatingApp.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace DatingApp.API.Controllers
{
    [Authorize]
    [Route("api/users/{userid}/photos")]
    [ApiController]
    public class PhotosController : ControllerBase
    {
        private readonly IDatingRepository repo;
        private readonly IMapper mapper;
        private readonly IOptions<CloudinarySettings> cloudinaryConfig;
        private Cloudinary cloudinary;

        public PhotosController(IDatingRepository repo, IMapper mapper, IOptions<CloudinarySettings> cloudinaryConfig)
        {
            this.cloudinaryConfig = cloudinaryConfig;
            this.mapper = mapper;
            this.repo = repo;

            Account acc = new Account(
                cloudinaryConfig.Value.CloudName,
                cloudinaryConfig.Value.ApiKey,
                cloudinaryConfig.Value.ApiSecret
            );

            cloudinary = new Cloudinary(acc); // need to pass acct
        }

        [HttpGet("{id}", Name = "GetPhoto")]
        public async Task<IActionResult> GetPhoto(int id){
            var photoFromRepo = await repo.GetPhoto(id);

            var photo = mapper.Map<PhotoForReturnDto>(photoFromRepo);

            return Ok(photo);
        }

        [HttpPost]
        public async Task<IActionResult> AddPhotoForUser(int userId, 
                    [FromForm]PhotoForCreationDto photoForCreationDto){ //  add from form because 
                    // we pass it from postman form
            // check if the user id editing the page is the one from the token
            if (userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value)) return Unauthorized();

            var userFromRepo = await this.repo.GetUser(userId);

            var file = photoForCreationDto.File;

            var uploadResult = new ImageUploadResult();

            if (file.Length > 0){
                using (var stream = file.OpenReadStream()){
                    var uploadParams = new ImageUploadParams(){
                        File = new FileDescription(file.Name, stream),
                        Transformation = new Transformation().Width(500).Height(500) // crop the image if its too big/long
                            .Crop("fill").Gravity("face")
                    };

                    uploadResult = this.cloudinary.Upload(uploadParams); // upload to cloudinary
                }
            }

            photoForCreationDto.Url = uploadResult.Url.ToString();
            photoForCreationDto.PublicId = uploadResult.PublicId;

            var photo = mapper.Map<Photo>(photoForCreationDto);

            if (!userFromRepo.Photos.Any(u => u.IsMain)) photo.IsMain = true; // if user doesn't have photos yet, set uploaded to main

            userFromRepo.Photos.Add(photo);

            if (await repo.SaveAll()){
                var photoToReturn = mapper.Map<PhotoForReturnDto>(photo);
                return CreatedAtRoute("GetPhoto", new {userid = userId, id = photo.Id}, photoToReturn);
            }

            return BadRequest("Could not upload photo!");
        }

        [HttpPost("{id}/setMain")] // using post for minimal or basic update in the api
        public async Task<IActionResult> SetMainPhoto(int userId, int id){
            // check if the user id editing the page is the one from the token
            if (userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value)) return Unauthorized();

            var user = await repo.GetUser(userId);

            if (!user.Photos.Any(p => p.Id == id)) return Unauthorized(); // if passed photo id does not exist

            var photoFromRepo = await repo.GetPhoto(id);

            if (photoFromRepo.IsMain) return BadRequest("This is already the main photo!");

            var currentMainPhoto = await repo.GetMainPhotoForUser(userId);
            currentMainPhoto.IsMain = false;

            photoFromRepo.IsMain = true;

            if (await repo.SaveAll()) return NoContent();

            return BadRequest("Could not set photo to main!");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePhoto(int userId, int id){
             // check if the user id editing the page is the one from the token
            if (userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value)) return Unauthorized();

            var user = await repo.GetUser(userId);

            if (!user.Photos.Any(p => p.Id == id)) return Unauthorized(); // if passed photo id does not exist

            var photoFromRepo = await repo.GetPhoto(id);

            if (photoFromRepo.IsMain) return BadRequest("You cannot delete your main photo!");

            if (photoFromRepo.PublicId != null){
                var deleteParams = new DeletionParams(photoFromRepo.PublicId);

                var result = cloudinary.Destroy(deleteParams); // for cloudinary deletion 

                if (result.Result == "ok") repo.Delete(photoFromRepo); 
            }
            else{
                repo.Delete(photoFromRepo);
            }

            if (await repo.SaveAll()) return Ok(); // return OK for delete methods

            return BadRequest("Failed to delete photo!");
        }
    }
}