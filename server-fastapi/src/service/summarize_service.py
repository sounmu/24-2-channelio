from fastapi import HTTPException, status
from schema.summarize_schema import SummarizeInput, SummarizeOutput
from config import Settings
from openai import OpenAI

OPENAI_API_KEY = Settings().OPENAI_API_KEY
client = OpenAI(api_key=OPENAI_API_KEY)

async def service_summarize(
    request: SummarizeInput
) -> SummarizeOutput:
    
    # 입력값 검증
    if not request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request body is required"
        )

    messages = request.data
    if not messages or len(messages) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid input: messages array is required"
        )

    if not all([message.personId, message.plainText] for message in messages):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="personId, and plainText are required"
        )

    try:
        # 각 메시지를 포맷팅하여 대화 내용 구성
        formatted_messages = []
        for message in messages:
            formatted_message = f"[{message.personId}] {message.plainText}"
            formatted_messages.append(formatted_message)

        prompt = f"다음 회의록을 요약해 주세요. 대화 순서는 오름차순으로 정렬되어 있습니다.\nText:\"\"\"{chr(10).join(formatted_messages)}\"\"\""

        # OpenAI API 호출 부분
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes conversations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.5
        )

        # 수정된 응답 처리 부분
        if not completion.choices:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No response from OpenAI"
            )
            
        message_content = completion.choices[0].message.content
        if not message_content:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate summary from OpenAI"
            )
        summarized_text = message_content.strip()
 
        
        # 테스트용 임시 코드
        # summarized_text = prompt

        return SummarizeOutput(
            output=summarized_text
        )

    except Exception as e:
        error_message = str(e)
        print(f"Summarize function error: {error_message}", {
            "error": error_message,
        })
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Summarize failed: {error_message}"
        )
